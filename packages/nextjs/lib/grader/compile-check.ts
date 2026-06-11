import type { CompilerPhase } from "~~/lib/solc/solc";
import { compileSolidity } from "~~/lib/solc/solc";

// Wraps solc so a code-exercise verdict is decided by the compiler, not the model.

export type CompileCheckResult = { ok: true } | { ok: false; errors: string[] };

export async function compileCheck(
  assembled: string,
  onPhase?: (phase: CompilerPhase) => void,
): Promise<CompileCheckResult> {
  const r = await compileSolidity(assembled, onPhase);
  // worker already splits by severity; ok:false means real errors, warnings never fail.
  return r.ok ? { ok: true } : { ok: false, errors: r.errors };
}
