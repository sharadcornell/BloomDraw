// generate-image (docs/05 §3) — safe prompt → kid-safe image (+ optional line art).
//
//   1. validate input + (real-mode) enforce per-device/global limits
//   2. DEFENSIVELY re-moderate the safePrompt (never trust the caller)
//   3. write/maintain an ai_generations row when Supabase is configured
//   4. generate image (+ line art) via the provider, with a timeout
//   5. return imageUrl + lineArtUrl (+ demo:true in mock mode)
//
// V1 returns only imageUrl + lineArtUrl (docs/04 §2.5: sketch/cartoon/coloring
// columns are future-use for the AI-prompt flow).
import { getProvider, loadAiConfig } from '../_shared/ai-provider/index.ts';
import {
  insertGeneration,
  updateGeneration,
} from '../_shared/db.ts';
import { enforceLimits } from '../_shared/enforce.ts';
import { AppError } from '../_shared/errors.ts';
import { makeHandler } from '../_shared/handler.ts';
import { okEnvelope } from '../_shared/response.ts';
import { withTimeout } from '../_shared/timeout.ts';
import { parseJsonBody, validateAgeRange, validatePrompt } from '../_shared/validation.ts';

Deno.serve(
  makeHandler(async (req) => {
    const body = await parseJsonBody(req);
    const safePromptIn = validatePrompt(body.safePrompt, 'safePrompt');
    const ageRange = validateAgeRange(body.ageRange);
    const options = (body.options ?? {}) as Record<string, unknown>;
    const wantLineArt = options.lineArt !== false; // default true
    const projectionReady = options.projectionReady === true;
    const size = typeof options.size === 'string' ? options.size : undefined;

    const cfg = loadAiConfig();
    const provider = getProvider();

    // Rate limiting (real mode) + resolve client/session for DB writes.
    const { sessionId, client } = await enforceLimits(req.headers);

    // Defensive re-moderation — block if the "safe" prompt is not actually safe.
    const moderation = await provider.moderatePrompt(safePromptIn, ageRange);
    if (moderation.status === 'blocked') {
      throw new AppError('blocked_prompt', `defensive block reason=${moderation.reasonCode}`);
    }
    const safePrompt = moderation.safePrompt || safePromptIn;

    // Create the row (best-effort). original_prompt mirrors safePrompt here since
    // this endpoint only receives the already-safe prompt (the original lived in
    // moderate-prompt). M7 may pass the original through later.
    let generationId: string | null = null;
    if (client) {
      generationId = await insertGeneration(client, {
        sessionId,
        originalPrompt: safePromptIn,
        safePrompt,
        moderationStatus: moderation.status,
        provider: provider.name,
      });
    }

    try {
      const main = await withTimeout(
        provider.generateImage(safePrompt, { ageRange, style: 'illustration', size }),
        cfg.providerTimeoutMs,
        'generate image',
      );

      let lineArtUrl: string | null = null;
      if (wantLineArt) {
        const la = await withTimeout(
          provider.generateImage(safePrompt, { ageRange, style: projectionReady ? 'projection' : 'line_art' }),
          cfg.providerTimeoutMs,
          'generate line art',
        );
        lineArtUrl = la.imageUrl;
      }

      if (client && generationId) {
        await updateGeneration(client, generationId, {
          generation_status: 'complete',
          output_image_url: main.imageUrl,
          line_art_url: lineArtUrl,
        });
      }

      return {
        body: okEnvelope({
          generationId,
          imageUrl: main.imageUrl,
          lineArtUrl,
          provider: provider.name,
          status: 'complete',
          demo: provider.isMock,
        }),
      };
    } catch (err) {
      if (client && generationId) {
        await updateGeneration(client, generationId, {
          generation_status: 'failed',
          error_message: err instanceof AppError ? (err.logDetail ?? err.code) : String(err),
        });
      }
      throw err instanceof AppError ? err : new AppError('provider_unavailable', String(err));
    }
  }),
);
