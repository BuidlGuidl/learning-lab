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
};

// Every grading state in one place, shared by both card types: error, streaming, graded.
export const GradeFeedback = ({ pending, error, verdict, feedback, missedConcepts }: Props) => {
  // error, not a fail — nudge to retry, no verdict.
  if (error) {
    return (
      <div className="alert alert-warning mt-4">
        <span>Couldn&apos;t reach the grader. Check your answer and submit again.</span>
      </div>
    );
  }

  if (!pending && !verdict && !feedback) return null;

  return (
    <div className="mt-4 rounded-box border border-base-300 bg-base-200/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        {pending && !verdict ? (
          <>
            <span className="loading loading-dots loading-sm text-primary" />
            <span className="text-sm text-base-content/60">grading…</span>
          </>
        ) : verdict ? (
          <VerdictChip verdict={verdict} />
        ) : null}
      </div>
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
    </div>
  );
};
