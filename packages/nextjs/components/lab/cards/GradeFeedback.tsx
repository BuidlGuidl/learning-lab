import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { GradingOutcome } from "~~/lib/grader/transcript";

// Plain pass/fail chip; the "you can recover" tone lives in the feedback, not the label.
const VerdictChip = ({ verdict }: { verdict: GradingOutcome }) => {
  const tone = verdict === "pass" ? "badge-success" : verdict === "fail" ? "badge-error" : "badge-ghost";
  return <span className={`badge ${tone} font-mono uppercase text-xs tracking-wider`}>{verdict}</span>;
};

type Props = {
  pending: boolean;
  error?: Error;
  verdict?: GradingOutcome;
  feedback?: string;
  missedConcepts?: string[];
  compilerErrors?: string[];
};

// Every grading state in one place, shared by both card types: error, streaming, graded.
export const GradeFeedback = ({ pending, error, verdict, feedback, missedConcepts, compilerErrors }: Props) => {
  // error, not a fail — nudge to retry, no verdict.
  if (error) {
    return (
      <div className="alert alert-warning mt-4">
        <span>Couldn&apos;t reach the grader. Check your answer and submit again.</span>
      </div>
    );
  }

  // Hold the whole result until feedback starts, so the chip and its coaching reveal as one
  // beat. A compile-fail knows the verdict early, but showing it alone then popping text in
  // 2s later reads as a stall — wait for the words.
  const waiting = pending && !feedback;
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
