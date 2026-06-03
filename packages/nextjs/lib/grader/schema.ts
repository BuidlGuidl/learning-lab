import { z } from "zod";

// Grader output, shared by the route (Output.object) and the client (useObject) so both
// ends agree on the shape. Verdict is binary on purpose — no soft middle to coast through.
export const verdictSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  feedback: z.string(),
  missedConcepts: z.array(z.string()),
});

export type Verdict = z.infer<typeof verdictSchema>;
