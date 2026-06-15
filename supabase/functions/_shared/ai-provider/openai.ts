// OpenAI provider (docs/03 §7). DEFAULT real provider. Used only when a key is
// present AND mock mode is off — so it never runs in tests (mock fallback).
//
// Model IDs come from config (env), never hardcoded. The exact image/edit
// request shapes are best-effort and must be verified at the real-key pilot
// (brief open question #1); on any failure we throw a child-safe AppError and
// the function returns the "nap" retry message.
import { getEnv } from '../env.ts';
import { AppError } from '../errors.ts';
import { classifyPrompt, rewritePrompt } from '../moderation.ts';
import { strings } from '../strings.ts';
import { loadAiConfig } from './config.ts';
import type {
  AIProvider,
  GenerateOptions,
  ImageResult,
  ModerationResult,
  TransformStyle,
  AgeRange,
} from '../types.ts';

const OPENAI_BASE = 'https://api.openai.com/v1';

// OpenAI moderation categories we treat as hard blocks for a kids' product.
const HARD_BLOCK_CATEGORIES: { key: string; reason: string }[] = [
  { key: 'sexual', reason: 'sexual' },
  { key: 'sexual/minors', reason: 'sexual' },
  { key: 'hate', reason: 'hate' },
  { key: 'hate/threatening', reason: 'hate' },
  { key: 'harassment/threatening', reason: 'hate' },
  { key: 'self-harm', reason: 'self_harm' },
  { key: 'self-harm/intent', reason: 'self_harm' },
  { key: 'self-harm/instructions', reason: 'self_harm' },
  { key: 'violence', reason: 'violence' },
  { key: 'violence/graphic', reason: 'violence' },
  { key: 'illicit', reason: 'dangerous' },
  { key: 'illicit/violent', reason: 'dangerous' },
];

function apiKey(): string {
  const key = getEnv('OPENAI_API_KEY');
  if (!key) throw new AppError('provider_unavailable', 'OPENAI_API_KEY missing');
  return key;
}

async function openaiJson(path: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${OPENAI_BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new AppError('provider_unavailable', `openai fetch failed ${path}: ${String(e)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const code = res.status === 429 ? 'rate_limited' : 'provider_unavailable';
    throw new AppError(code, `openai ${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Wrap a kid-safe styling instruction around the user prompt. */
function styledPrompt(prompt: string, style?: GenerateOptions['style']): string {
  const base = `A friendly, colorful, kid-safe illustration for children: ${prompt}.`;
  if (style === 'line_art' || style === 'projection') {
    return `${base} Simple bold black outline line-art on a plain white background, high contrast, no shading — easy to trace.`;
  }
  return `${base} Cheerful, simple, age-appropriate, no scary or adult content.`;
}

function imageUrlFromResponse(json: unknown): string {
  const data = (json as { data?: { url?: string; b64_json?: string }[] }).data?.[0];
  if (data?.url) return data.url;
  if (data?.b64_json) return `data:image/png;base64,${data.b64_json}`;
  throw new AppError('provider_unavailable', 'openai image response missing data');
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  readonly isMock = false;

  async moderatePrompt(prompt: string, ageRange?: AgeRange): Promise<ModerationResult> {
    const cfg = loadAiConfig();
    const json = (await openaiJson('/moderations', { model: cfg.models.moderation, input: prompt })) as {
      results?: { flagged?: boolean; categories?: Record<string, boolean> }[];
    };
    const result = json.results?.[0];
    if (result?.flagged) {
      const hit = HARD_BLOCK_CATEGORIES.find((c) => result.categories?.[c.key]);
      if (hit) {
        return { status: 'blocked', safePrompt: '', userMessage: strings.safety.blocked, reasonCode: hit.reason };
      }
    }
    // Not hard-flagged → use the shared soften/rewrite ladder for borderline cases.
    const local = classifyPrompt(prompt);
    if (local.kind === 'block') {
      return { status: 'blocked', safePrompt: '', userMessage: strings.safety.blocked, reasonCode: local.category };
    }
    if (local.kind === 'safe') {
      return { status: 'safe', safePrompt: prompt.trim(), userMessage: '', reasonCode: 'ok' };
    }
    // Borderline → LLM rewrite, then re-check ONCE (no loop).
    const rewritten = await this.rewritePromptForKidSafety(prompt, ageRange);
    const recheck = classifyPrompt(rewritten);
    if (recheck.kind === 'safe') {
      return {
        status: 'rewritten',
        safePrompt: rewritten,
        userMessage: strings.safety.rewritten,
        reasonCode: 'rewrite_softened',
      };
    }
    return { status: 'blocked', safePrompt: '', userMessage: strings.safety.blocked, reasonCode: 'scary' };
  }

  async rewritePromptForKidSafety(prompt: string, _ageRange?: AgeRange): Promise<string> {
    const cfg = loadAiConfig();
    try {
      const json = (await openaiJson('/chat/completions', {
        model: cfg.models.rewrite,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You rewrite a child’s drawing idea into a gentle, friendly, age-appropriate version. ' +
              'Remove any violence, weapons, blood, scary, sexual, hateful or dangerous elements. ' +
              'Keep it short (a single image description), positive and imaginative. Reply with ONLY the rewritten idea.',
          },
          { role: 'user', content: prompt },
        ],
      })) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) {
      console.warn('[openai] rewrite failed, using local rewrite', String(e));
    }
    // Fail-safe: deterministic local rewrite.
    return rewritePrompt(prompt);
  }

  async generateImage(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const cfg = loadAiConfig();
    const json = await openaiJson('/images/generations', {
      model: cfg.models.image,
      prompt: styledPrompt(prompt, options?.style),
      size: options?.size ?? '1024x1024',
      n: 1,
    });
    return { imageUrl: imageUrlFromResponse(json), provider: this.name };
  }

  // Image transforms via OpenAI image edits. Verify request shape at the real-key
  // pilot; this fetches the source bytes then asks for a styled white-background
  // line/cartoon/coloring rendering.
  async transformImage(imageUrl: string, style: TransformStyle): Promise<ImageResult> {
    const cfg = loadAiConfig();
    let bytes: Blob;
    try {
      const srcRes = await fetch(imageUrl);
      if (!srcRes.ok) throw new Error(`source ${srcRes.status}`);
      bytes = await srcRes.blob();
    } catch (e) {
      throw new AppError('provider_unavailable', `openai edit source fetch failed: ${String(e)}`);
    }
    const form = new FormData();
    form.append('model', cfg.models.image);
    form.append('image', bytes, 'source.png');
    form.append('prompt', styleInstruction(style));
    form.append('size', '1024x1024');
    let res: Response;
    try {
      res = await fetch(`${OPENAI_BASE}/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey()}` },
        body: form,
      });
    } catch (e) {
      throw new AppError('provider_unavailable', `openai edits fetch failed: ${String(e)}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const code = res.status === 429 ? 'rate_limited' : 'provider_unavailable';
      throw new AppError(code, `openai /images/edits ${res.status}: ${text.slice(0, 200)}`);
    }
    return { imageUrl: imageUrlFromResponse(await res.json()), provider: this.name };
  }

  generateLineArt(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'line_art');
  }
  generateSketch(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'sketch');
  }
  generateCartoon(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'cartoon');
  }
  generateColoringPage(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'coloring_page');
  }
}

function styleInstruction(style: TransformStyle): string {
  switch (style) {
    case 'line_art':
      return 'Convert to simple bold black outline line-art on a plain white background, high contrast, easy to trace.';
    case 'sketch':
      return 'Convert to a soft pencil sketch, light grey shading on a white background.';
    case 'cartoon':
      return 'Convert to a friendly, colorful cartoon suitable for young children.';
    case 'coloring_page':
      return 'Convert to a clean black-and-white coloring-book page with bold outlines and empty regions to color.';
  }
}
