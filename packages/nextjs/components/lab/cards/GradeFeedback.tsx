import { SparklesIcon } from "@heroicons/react/24/outline";
import type { GradingOutcome } from "~~/lib/grader/transcript";

// Plain pass/fail chip; the "you can recover" tone lives in the feedback, not the label.
const VerdictChip = ({ verdict }: { verdict: GradingOutcome }) => {
  const tone = verdict === "pass" ? "badge-success" : verdict === "fail" ? "badge-error" : "badge-ghost";
  return <span className={`badge ${tone} font-mono uppercase text-xs tracking-wider`}>{verdict}</span>;
};

const MissedConcepts = ({ concepts }: { concepts: string[] }) => (
  <div className="mt-3 flex flex-wrap items-center gap-1.5">
    <span className="text-xs text-base-content/50 uppercase tracking-wider">missed</span>
    {concepts.map((concept, i) => (
      <span key={i} className="badge badge-ghost badge-sm">
        {concept}
      </span>
    ))}
  </div>
);

type Props = {
  pending: boolean;
  error?: Error;
  verdict?: GradingOutcome;
  feedback?: string;
  missedConcepts?: string[];
  // "grader" owns the verdict (question cards); "coach" never shows a chip —
  // the test panel above it already decided, these are just the words.
  variant?: "grader" | "coach";
};

export const GradeFeedback = ({ pending, error, verdict, feedback, missedConcepts, variant = "grader" }: Props) => {
  if (variant === "coach") {
    // tests own the verdict; an unreachable coach is a footnote, not an alert
    if (error && !feedback) {
      return (
        <p className="mt-3 mb-0 text-xs text-base-content/50">
          Couldn&apos;t reach the coach — the result above stands.
        </p>
      );
    }
    if (!pending && !feedback && (!missedConcepts || missedConcepts.length === 0)) return null;

    return (
      <div className="mt-3 rounded-box border-l-2 border-accent/70 bg-base-200/40 px-4 py-3 transition-opacity duration-300 opacity-100 starting:opacity-0">
        <div className="mb-1.5 flex items-center gap-1.5 text-base-content/50">
          <SparklesIcon className="h-3 w-3" />
          <span className="text-[10px] uppercase tracking-[0.2em]">coach</span>
        </div>
        {feedback ? (
          <p className="text-base-content/90 leading-relaxed whitespace-pre-wrap m-0">{feedback}</p>
        ) : (
          <span className="loading loading-dots loading-xs text-base-content/50" />
        )}
        {missedConcepts && missedConcepts.length > 0 && <MissedConcepts concepts={missedConcepts} />}
      </div>
    );
  }

  // error with no verdict — nudge to retry.
  if (error && !verdict) {
    return (
      <div className="alert alert-warning mt-4">
        <span>Couldn&apos;t reach the grader. Check your answer and submit again.</span>
      </div>
    );
  }

  const waiting = pending && !verdict && !feedback;
  if (!waiting && !verdict && !feedback) return null;

  return (
    <div className="mt-4 rounded-box border border-base-300 bg-base-200/40 p-4">
      {waiting ? (
        <div className="flex items-center gap-2">
          <span className="loading loading-dots loading-sm text-lab-violet" />
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
          {feedback && <p className="text-base-content/90 leading-relaxed whitespace-pre-wrap m-0">{feedback}</p>}
          {missedConcepts && missedConcepts.length > 0 && <MissedConcepts concepts={missedConcepts} />}
        </div>
      )}
    </div>
  );
};
