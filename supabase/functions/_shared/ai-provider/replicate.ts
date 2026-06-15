// Replicate provider (docs/03 §7) — ALTERNATE real provider. Used only when
// AI_PROVIDER=replicate, a token is present, and mock mode is off (never in
// tests). Replicate has no moderation/chat endpoint, so moderation + rewrite
// reuse the shared local ladder; image generation/transform call hosted models.
//
// Model/version IDs come from env (REPLICATE_IMAGE_MODEL) — never hardcoded.
// Exact model + input schema must be verified at the real-key pilot.
import { getEnv } from '../env.ts';
import { AppError } from '../errors.ts';
import { moderatePromptLocal, rewritePrompt } from '../moderation.ts';
import { loadAiConfig } from './config.ts';
import type {
  AIProvider,
  GenerateOptions,
  ImageResult,
  ModerationResult,
  TransformStyle,
  AgeRange,
} from '../types.ts';

const REPLICATE_BASE = 'https://api.replicate.com/v1';
const POLL_INTERVAL_MS = 1_200;
const MAX_POLLS = 40;

function token(): string {
  const t = getEnv('REPLICATE_API_TOKEN');
  if (!t) throw new AppError('provider_unavailable', 'REPLICATE_API_TOKEN missing');
  return t;
}

interface Prediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: unknown;
  urls?: { get?: string };
}

async function replicateFetch(path: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${REPLICATE_BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch (e) {
    throw new AppError('provider_unavailable', `replicate fetch failed ${path}: ${String(e)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const code = res.status === 429 ? 'rate_limited' : 'provider_unavailable';
    throw new AppError(code, `replicate ${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

/** Create a prediction then poll until it terminates; return the first output URL. */
async function runModel(input: Record<string, unknown>): Promise<string> {
  const cfg = loadAiConfig();
  const created = (await (
    await replicateFetch('/predictions', {
      method: 'POST',
      body: JSON.stringify({ model: cfg.models.replicateImage, input }),
    })
  ).json()) as Prediction;

  let pred = created;
  for (let i = 0; i < MAX_POLLS && (pred.status === 'starting' || pred.status === 'processing'); i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const getUrl = pred.urls?.get ?? `${REPLICATE_BASE}/predictions/${pred.id}`;
    pred = (await (await replicateFetch(getUrl.replace(REPLICATE_BASE, ''), { method: 'GET' })).json()) as Prediction;
  }
  if (pred.status !== 'succeeded') {
    throw new AppError('provider_unavailable', `replicate prediction ${pred.status}`);
  }
  const out = pred.output;
  const url = Array.isArray(out) ? out[0] : out;
  if (typeof url !== 'string') throw new AppError('provider_unavailable', 'replicate output missing url');
  return url;
}

function styledPrompt(prompt: string, style?: GenerateOptions['style']): string {
  const base = `friendly colorful kid-safe children's illustration: ${prompt}`;
  if (style === 'line_art' || style === 'projection') {
    return `${base}, simple bold black outline line art on white background, high contrast, easy to trace`;
  }
  return base;
}

function styleSuffix(style: TransformStyle): string {
  switch (style) {
    case 'line_art':
      return 'bold black outline line art on white background, high contrast';
    case 'sketch':
      return 'soft pencil sketch, light shading on white';
    case 'cartoon':
      return 'friendly colorful cartoon for children';
    case 'coloring_page':
      return 'black and white coloring book page, bold outlines';
  }
}

export class ReplicateProvider implements AIProvider {
  readonly name = 'replicate' as const;
  readonly isMock = false;

  // Replicate has no text moderation; use the shared deterministic ladder.
  moderatePrompt(prompt: string, ageRange?: AgeRange): Promise<ModerationResult> {
    return Promise.resolve(moderatePromptLocal(prompt, ageRange));
  }

  rewritePromptForKidSafety(prompt: string): Promise<string> {
    return Promise.resolve(rewritePrompt(prompt));
  }

  async generateImage(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const url = await runModel({ prompt: styledPrompt(prompt, options?.style) });
    return { imageUrl: url, provider: this.name };
  }

  async transformImage(imageUrl: string, style: TransformStyle): Promise<ImageResult> {
    const url = await runModel({ image: imageUrl, prompt: styleSuffix(style) });
    return { imageUrl: url, provider: this.name };
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
