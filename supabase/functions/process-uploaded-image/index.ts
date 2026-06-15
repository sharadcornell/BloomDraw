// process-uploaded-image (docs/05 §5) — one upload → multiple style variants in
// one call (used by the upload flow). Accepts imageUrl OR uploadRef + optional
// styles[] (default all four). Writes an uploaded_images row when Supabase is
// configured. Partial success returns the variants that worked + status:'partial'.
import { getProvider, loadAiConfig } from '../_shared/ai-provider/index.ts';
import { insertUploaded, signedUrlForRef, STYLE_COLUMN, updateUploaded } from '../_shared/db.ts';
import { enforceLimits } from '../_shared/enforce.ts';
import { AppError } from '../_shared/errors.ts';
import { makeHandler } from '../_shared/handler.ts';
import { okEnvelope } from '../_shared/response.ts';
import { withTimeout } from '../_shared/timeout.ts';
import type { TransformStyle } from '../_shared/types.ts';
import { parseJsonBody, validateImageSource, validateStyles } from '../_shared/validation.ts';

Deno.serve(
  makeHandler(async (req) => {
    const body = await parseJsonBody(req);
    const source = validateImageSource(body);
    const styles = validateStyles(body.styles);

    const cfg = loadAiConfig();
    const provider = getProvider();
    const { sessionId, client } = await enforceLimits(req.headers);

    // Resolve source for the provider (signed URL for an uploadRef when possible).
    let sourceUrl = source.imageUrl ?? source.key;
    if (!source.imageUrl && source.uploadRef && client) {
      sourceUrl = (await signedUrlForRef(client, source.uploadRef)) ?? source.uploadRef;
    }
    const originalRef = source.imageUrl ?? source.uploadRef ?? source.key;

    // Create the row (best-effort).
    let uploadedImageId: string | null = null;
    if (client) {
      uploadedImageId = await insertUploaded(client, { sessionId, originalImageUrl: originalRef });
    }

    const urls: Record<TransformStyle, string | null> = {
      line_art: null,
      sketch: null,
      cartoon: null,
      coloring_page: null,
    };
    let succeeded = 0;
    let failed = 0;

    for (const style of styles) {
      try {
        const result = await withTimeout(
          provider.transformImage(sourceUrl, style),
          cfg.providerTimeoutMs,
          `process ${style}`,
        );
        urls[style] = result.imageUrl;
        succeeded += 1;
      } catch (err) {
        failed += 1;
        console.error(`[process] style=${style} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const apiStatus = succeeded === 0 ? 'failed' : failed > 0 ? 'partial' : 'complete';

    if (client && uploadedImageId) {
      const patch: Record<string, unknown> = {
        // processed_status enum has no 'partial' → store 'complete' when anything succeeded.
        processed_status: succeeded === 0 ? 'failed' : 'complete',
      };
      for (const style of styles) patch[STYLE_COLUMN[style]] = urls[style];
      await updateUploaded(client, uploadedImageId, patch);
    }

    // All styles failed → surface the child-safe "nap" error.
    if (succeeded === 0) {
      throw new AppError('provider_unavailable', 'all requested styles failed');
    }

    return {
      body: okEnvelope({
        uploadedImageId,
        originalUrl: sourceUrl,
        lineArtUrl: urls.line_art,
        sketchUrl: urls.sketch,
        cartoonUrl: urls.cartoon,
        coloringPageUrl: urls.coloring_page,
        status: apiStatus,
        demo: provider.isMock,
      }),
    };
  }),
);
