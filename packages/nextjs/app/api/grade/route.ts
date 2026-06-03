import { Output, streamText } from "ai";
import { registry } from "~~/labs/registry";
import { GRADER_MODEL, GRADER_PROVIDER_OPTIONS, openrouter } from "~~/lib/ai/ai.config";
import type { CompileCheckResult } from "~~/lib/grader/compile-check";
import { buildGradingPrompt, projectHistory } from "~~/lib/grader/prompt";
import { verdictSchema } from "~~/lib/grader/schema";
import type { LearningTranscript } from "~~/lib/grader/transcript";
import { nextAttempt } from "~~/lib/grader/transcript";

// Client submits raw inputs; the server loads the lab, builds the prompt, and streams the
// verdict. Prompt construction stays server-side so canonical answers never ship to the
// client — not an anti-cheat boundary, since the transcript and gate are client-trusted.
export const maxDuration = 60;

type GradeBody = {
  labId: string;
  cardId: string;
  answer: string;
  compileResult?: CompileCheckResult;
  transcript: LearningTranscript;
};

export async function POST(req: Request) {
  const body = (await req.json()) as GradeBody;

  const entry = registry[body.labId];
  if (!entry) return new Response(`unknown lab: ${body.labId}`, { status: 404 });
  const { lab } = await entry.load();

  // card + its 1-based position across the lab, for the "card N" framing.
  let card: (typeof lab.chapters)[number]["cards"][number] | undefined;
  let cardNumberInLab = 0;
  let n = 0;
  for (const chapter of lab.chapters) {
    for (const c of chapter.cards) {
      n++;
      if (c.id === body.cardId) {
        card = c;
        cardNumberInLab = n;
      }
    }
  }
  if (!card) return new Response(`unknown card: ${body.cardId}`, { status: 404 });
  if (card.type !== "code-exercise" && card.type !== "question") {
    return new Response(`card ${body.cardId} is not gradable`, { status: 400 });
  }

  const history = projectHistory(body.transcript, body.cardId);
  const attempt = nextAttempt(body.transcript, body.cardId);
  const { system, prompt } = buildGradingPrompt({
    lab,
    card,
    cardNumberInLab,
    attempt,
    answer: body.answer,
    history,
    compileResult: body.compileResult,
  });

  const result = streamText({
    model: openrouter(GRADER_MODEL),
    system,
    prompt,
    output: Output.object({ schema: verdictSchema }),
    providerOptions: GRADER_PROVIDER_OPTIONS,
    // streamText swallows mid-stream provider errors so the route can't crash; without this
    // hook a rate-limit/5xx leaves zero server trace. The client surfaces its own retry.
    onError: ({ error }) => console.error("[grade] stream error", error),
  });

  return result.toTextStreamResponse();
}
