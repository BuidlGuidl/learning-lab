import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { RunProgress, TestResult } from "~~/lib/lab/run";

// Always-visible checks panel. The assertions show up front as a todo list so
// the learner knows exactly what their code is graded against, and a run just
// flips glyphs in place — no layout jump on submit. The header narrates the
// machine phases (fetching compiler → compiling → running) while it's live.

type RowGlyph = "todo" | "running" | "pass" | "fail";

const Glyph = ({ glyph }: { glyph: RowGlyph }) => {
  if (glyph === "pass") return <span className="text-success">✓</span>;
  if (glyph === "fail") return <span className="text-error">✗</span>;
  if (glyph === "running") return <span className="loading loading-spinner loading-xs text-base-content/60" />;
  return <span className="text-base-content/30">○</span>;
};

type Props = {
  testNames: string[]; // the region's assertions, known before any run
  progress: RunProgress | null; // non-null while a run is live
  verdict?: "pass" | "fail"; // settled verdict, from the report or the transcript
  results?: TestResult[];
  compilerErrors?: string[];
};

export const TestRunPanel = ({ testNames, progress, verdict, results, compilerErrors }: Props) => {
  const live = progress !== null;
  const settled = !live && verdict !== undefined;
  const compileFailed = settled && !!compilerErrors?.length;

  // store names are the base; recorded results fill in if the store is empty
  const names = testNames.length > 0 ? testNames : (results ?? []).map(r => r.name);
  if (names.length === 0 && !live && !settled) return null;

  const done = live ? (progress.step === "testing" ? progress.results : []) : settled ? (results ?? []) : [];
  const byName = new Map(done.map(r => [r.name, r]));

  const glyphFor = (name: string, i: number): RowGlyph => {
    const r = byName.get(name);
    if (r) return r.passed ? "pass" : "fail";
    if (live && progress.step === "testing" && i === done.length) return "running";
    return "todo";
  };

  const phaseText =
    progress?.step === "fetching-compiler"
      ? "fetching compiler"
      : progress?.step === "compiling"
        ? "compiling"
        : progress?.step === "testing"
          ? `running ${done.length}/${progress.total}`
          : "";

  return (
    <div className="mt-4 overflow-hidden rounded-box border border-base-300 bg-base-300/30">
      <div className="flex items-center justify-between border-b border-base-300 bg-base-300/40 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-base-content/50">tests</span>
        {live ? (
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-base-content/50">
            <span className="loading loading-spinner loading-xs" />
            {phaseText}
          </span>
        ) : settled ? (
          <span
            className={`badge badge-sm font-mono uppercase tracking-wider ${verdict === "pass" ? "badge-success" : "badge-error"}`}
          >
            {verdict}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wider text-base-content/40">
            {names.length} {names.length === 1 ? "check" : "checks"}
          </span>
        )}
      </div>

      <div className="px-4 py-3">
        {compileFailed && (
          <div className="mb-2.5">
            <p className="flex items-baseline gap-2 font-mono text-xs">
              <span className="flex w-3.5 justify-center text-error">✗</span>
              <span className="text-base-content/80">compile</span>
            </p>
            <details className="group mt-1 pl-[1.375rem]" open>
              <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-base-content/40 transition-colors hover:text-base-content/70">
                <ChevronRightIcon className="h-3 w-3 transition-transform group-open:rotate-90" />
                compiler output
              </summary>
              <pre className="mt-1.5 overflow-x-auto rounded-md border border-base-300 bg-base-300/40 p-3 font-mono text-xs leading-relaxed text-error/80">
                {compilerErrors.join("\n\n")}
              </pre>
            </details>
          </div>
        )}

        {names.length > 0 && (
          // checks that never ran (compile failure) stay dimmed todos
          <ul className={`space-y-1.5 ${compileFailed ? "opacity-50" : ""}`}>
            {names.map((name, i) => {
              const glyph = glyphFor(name, i);
              const error = byName.get(name)?.error;
              return (
                <li key={name} className="flex items-baseline gap-2 font-mono text-xs">
                  <span className="flex w-3.5 justify-center">
                    <Glyph glyph={glyph} />
                  </span>
                  <span className={glyph === "todo" ? "text-base-content/50" : "text-base-content/80"}>{name}</span>
                  {glyph === "fail" && error && <span className="text-error/70">— {error}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
