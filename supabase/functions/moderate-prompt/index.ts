// moderate-prompt (docs/05 §2) — classify a prompt → safe | rewritten | blocked.
// ALWAYS called before generate-image. Cheap; not separately rate-limited
// (docs/05 §11). Raw categories stay server-side; the child only sees userMessage.
import { getProvider } from '../_shared/ai-provider/index.ts';
import { makeHandler } from '../_shared/handler.ts';
import { okEnvelope } from '../_shared/response.ts';
import { parseJsonBody, validateAgeRange, validatePrompt } from '../_shared/validation.ts';

Deno.serve(
  makeHandler(async (req) => {
    const body = await parseJsonBody(req);
    const prompt = validatePrompt(body.prompt);
    const ageRange = validateAgeRange(body.ageRange);

    const provider = getProvider();
    const result = await provider.moderatePrompt(prompt, ageRange);

    // Minimal server-side diagnostics only when not safe — no prompt text logged.
    if (result.status !== 'safe') {
      console.log(`[moderate] status=${result.status} reason=${result.reasonCode} len=${prompt.length}`);
    }

    return {
      body: okEnvelope({
        status: result.status,
        safePrompt: result.safePrompt,
        userMessage: result.userMessage,
        reasonCode: result.reasonCode,
      }),
    };
  }),
);
