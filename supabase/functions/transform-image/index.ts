// transform-image (docs/05 §4) — one source image → one style.
// Accepts imageUrl OR uploadRef; returns outputImageUrl + style (+ demo in mock).
//
// This is the lightweight single-style call and does not persist a row (its
// contract has no uploadedImageId); rate-limit accounting is driven primarily by
// generate-image + process-uploaded-image rows. Mock derives a deterministic
// variant with no network/keys.
import { getProvider, loadAiConfig } from '../_shared/ai-provider/index.ts';
import { signedUrlForRef } from '../_shared/db.ts';
import { enforceLimits } from '../_shared/enforce.ts';
import { makeHandler } from '../_shared/handler.ts';
import { okEnvelope } from '../_shared/response.ts';
import { withTimeout } from '../_shared/timeout.ts';
import { parseJsonBody, validateImageSource, validateStyle } from '../_shared/validation.ts';

Deno.serve(
  makeHandler(async (req) => {
    const body = await parseJsonBody(req);
    const source = validateImageSource(body);
    const style = validateStyle(body.style);

    const cfg = loadAiConfig();
    const provider = getProvider();
    const { client } = await enforceLimits(req.headers);

    // Resolve a usable source: explicit URL, a signed URL for an uploadRef, or
    // (mock) the raw key for deterministic hashing.
    let sourceUrl = source.imageUrl ?? source.key;
    if (!source.imageUrl && source.uploadRef && client) {
      sourceUrl = (await signedUrlForRef(client, source.uploadRef)) ?? source.uploadRef;
    }

    const result = await withTimeout(
      provider.transformImage(sourceUrl, style),
      cfg.providerTimeoutMs,
      `transform ${style}`,
    );

    return {
      body: okEnvelope({
        outputImageUrl: result.imageUrl,
        style,
        provider: provider.name,
        status: 'complete',
        demo: provider.isMock,
      }),
    };
  }),
);
