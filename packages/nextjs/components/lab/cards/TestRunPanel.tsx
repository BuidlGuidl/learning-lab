import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { RunProgress, TestResult } from "~~/lib/lab/run";

// The behavioural run, rendered like a test runner: phase steps narrate the
// live wait (fetching compiler → compiling → running tests), then the rows
// settle into the ✓/✗ list with the PASS/FAIL chip. The coach panel below is
// deliberately a different material — this one is the machine's output.

type StepState = "pending" | "active" | "done";

const StepGlyph = ({ state }: { state: StepState }) => {
  if (state === "done") return <span className="text-success">✓</span>;
  if (state === "active") return <span className="loading loading-spinner loading-xs text-primary" />;
  return <span className="text-base-content/30">○</span>;
};

const PhaseStep = ({ state, label }: { state: StepState; label: string }) => (
  <li
    className={`flex items-center gap-2 font-mono text-xs ${
      state === "pending" ? "text-base-content/40" : "text-base-content/80"
    }`}
  >
    <span className="flex w-3.5 justify-center">
      <StepGlyph state={state} />
    </span>
    {label}
  </li>
);

const TestRow = ({ t }: { t: TestResult }) => (
  <li className="flex items-baseline gap-2 font-mono text-xs">
    <span className={`flex w-3.5 justify-center ${t.passed ? "text-success" : "text-error"}`}>
      {t.passed ? "✓" : "✗"}
    </span>
    <span className="text-base-content/80">{t.name}</span>
    {!t.passed && t.error && <span className="text-error/70">— {t.error}</span>}
  </li>
);

type Props = {
  progress: RunProgress | null; // non-null while a run is live
  verdict?: "pass" | "fail"; // settled verdict, from the report or the transcript
  results?: TestResult[];
  compilerErrors?: string[];
};

export const TestRunPanel = ({ progress, verdict, results, compilerErrors }: Props) => {
  const live = progress !== null;
  if (!live && !verdict) return null;

  // while live, only this run's rows — never the previous attempt's recorded ones
  const rows = live ? (progress.step === "testing" ? progress.results : []) : (results ?? []);
  const total = progress?.step === "testing" ? progress.total : rows.length;

  const fetchState: StepState = progress?.step === "fetching-compiler" ? "active" : "done";
  const compileState: StepState =
    progress?.step === "fetching-compiler" ? "pending" : progress?.step === "compiling" ? "active" : "done";
  const testState: StepState = progress?.step === "testing" ? "active" : "pending";

  return (
    <div className="mt-4 overflow-hidden rounded-box border border-base-300 bg-base-300/30">
      <div className="flex items-center justify-between border-b border-base-300 bg-base-300/40 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-base-content/50">tests</span>
        {live ? (
          <span className="font-mono text-[10px] uppercase tracking-wider text-base-content/50">
            {progress.step === "testing" ? `running ${rows.length}/${total}` : "running"}
          </span>
        ) : (
          <span
            className={`badge badge-sm font-mono uppercase tracking-wider ${verdict === "pass" ? "badge-success" : "badge-error"}`}
          >
            {verdict}
          </span>
        )}
      </div>

      <div className="px-4 py-3">
        {live && (
          <ul className="mb-1 space-y-1.5">
            <PhaseStep state={fetchState} label="fetch compiler" />
            <PhaseStep state={compileState} label="compile" />
            <PhaseStep
              state={testState}
              label={progress.step === "testing" ? `run tests (${rows.length}/${total})` : "run tests"}
            />
          </ul>
        )}

        {rows.length > 0 && (
          <ul className={`space-y-1.5 ${live ? "mt-2 border-t border-base-300/60 pt-2" : ""}`}>
            {rows.map((t, i) => (
              <TestRow key={i} t={t} />
            ))}
          </ul>
        )}

        {!live && compilerErrors && compilerErrors.length > 0 && (
          <>
            <p className="flex items-baseline gap-2 font-mono text-xs">
              <span className="flex w-3.5 justify-center text-error">✗</span>
              <span className="text-base-content/80">compile</span>
            </p>
            <details className="group mt-2" open>
              <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-base-content/40 transition-colors hover:text-base-content/70">
                <ChevronRightIcon className="h-3 w-3 transition-transform group-open:rotate-90" />
                compiler output
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md border border-base-300 bg-base-300/40 p-3 font-mono text-xs leading-relaxed text-error/80">
                {compilerErrors.join("\n\n")}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
};
