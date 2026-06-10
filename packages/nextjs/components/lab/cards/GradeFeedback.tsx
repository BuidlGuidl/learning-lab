import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { GradingOutcome } from "~~/lib/grader/transcript";

// Plain pass/fail chip; the "you can recover" tone lives in the feedback, not the label.
const VerdictChip = ({ verdict }: { verdict: GradingOutcome }) => {
  const tone = verdict === "pass" ? "badge-success" : verdict === "fail" ? "badge-error" : "badge-ghost";
  return <span className={`badge ${tone} font-mono uppercase text-xs tracking-wider`}>{verdict}</span>;
};

type TestResult = { name: string; passed: boolean; error?: string };

type Props = {
  pending: boolean;
  error?: Error;
  verdict?: GradingOutcome;
  feedback?: string;
  missedConcepts?: string[];
  compilerErrors?: string[];
  testResults?: TestResult[];
};

// Every grading state in one place, shared by both card types: error, streaming, graded.
export const GradeFeedback = ({
  pending,
  error,
  verdict,
  feedback,
  missedConcepts,
  compilerErrors,
  testResults,
}: Props) => {
  // error with no verdict — nudge to retry. With a verdict the tests already decided;
  // the coach being unreachable doesn't change the result.
  if (error && !verdict) {
    return (
      <div className="alert alert-warning mt-4">
        <span>Couldn&apos;t reach the grader. Check your answer and submit again.</span>
      </div>
    );
  }

  // The behavioural verdict lands before the coaching streams — show it the moment it
  // exists, with the test list, and let the words arrive underneath.
  const waiting = pending && !verdict && !feedback;
  if (!waiting && !verdict && !feedback) return null;

  return (
    <div className="mt-4 rounded-box border border-base-300 bg-base-200/40 p-4">
      {waiting ? (
        <div className="flex items-center gap-2">
          <span className="loading loading-dots loading-sm text-primary" />
          <span className="text-sm text-base-content/60">grading…</span>
        </div>
      ) : (
        // starting:opacity-0 fades the block in once on insertion, then streams without re-animating.
        <div className="transition-opacity duration-300 opacity-100 starting:opacity-0">
          {verdict && (
            <div className="mb-2">
              <VerdictChip verdict={verdict} />
            </div>
          )}
          {testResults && testResults.length > 0 && (
            <ul className="mb-2 space-y-0.5">
              {testResults.map((t, i) => (
                <li key={i} className="flex items-baseline gap-1.5 font-mono text-xs">
                  <span className={t.passed ? "text-success" : "text-error"}>{t.passed ? "✓" : "✗"}</span>
                  <span className="text-base-content/70">{t.name}</span>
                  {!t.passed && t.error && <span className="text-base-content/40">— {t.error}</span>}
                </li>
              ))}
            </ul>
          )}
          {pending && !feedback && (
            <div className="flex items-center gap-2 text-xs text-base-content/50">
              <span className="loading loading-dots loading-xs" />
              <span>coaching…</span>
            </div>
          )}
          {feedback && <p className="text-base-content/90 leading-relaxed whitespace-pre-wrap">{feedback}</p>}
          {missedConcepts && missedConcepts.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-base-content/50 uppercase tracking-wider">missed</span>
              {missedConcepts.map((concept, i) => (
                <span key={i} className="badge badge-ghost badge-sm">
                  {concept}
                </span>
              ))}
            </div>
          )}
          {compilerErrors && compilerErrors.length > 0 && (
            <details className="group mt-3">
              <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 text-xs uppercase tracking-wider text-base-content/40 transition-colors hover:text-base-content/70">
                <ChevronRightIcon className="h-3 w-3 transition-transform group-open:rotate-90" />
                compiler output
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md border border-base-300 bg-base-300/40 p-3 font-mono text-xs leading-relaxed text-base-content/70">
                {compilerErrors.join("\n\n")}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};
