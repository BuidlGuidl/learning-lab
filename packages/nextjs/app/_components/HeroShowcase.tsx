"use client";

// The hero's animated product preview. A browser-framed stage that auto-cycles
// through every card type a learner will meet — Concept, Code, Code Exercise,
// Question and Experiment — plus the Socratic AI tutor, each with a tiny
// live example. A stories-style progress bar drives the auto-advance; the
// legend below doubles as clickable tabs, and hovering pauses the rotation so
// people can read. Plain DOM + CSS transitions, themed with the lp-* tokens.
import { useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  LightBulbIcon,
  PencilSquareIcon,
  PlayIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const DWELL = 7000; // ms each card holds before advancing

const ConceptEx = () => (
  <div className="flex h-full items-center justify-center">
    <div className="grid grid-cols-6 gap-2.5">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            i === 7 || i === 10 ? "animate-pulse bg-lp-accent" : "bg-lp-accent/30",
          )}
        />
      ))}
    </div>
  </div>
);

const CODE_LINES: Array<[string, ReactNode, ("hl" | "ghost")?]> = [
  [
    "1",
    <>
      <span className="lc-k">contract</span> <span className="lc-f">CrowdFund</span> <span className="lc-p">{"{"}</span>
    </>,
  ],
  [
    "2",
    <>
      {"  "}
      <span className="lc-t">uint256</span> <span className="lc-k">public</span> <span className="lc-k">constant</span>{" "}
      goal <span className="lc-p">=</span> <span className="lc-n">10 ether</span>
      <span className="lc-p">;</span>
    </>,
    "hl",
  ],
  [
    "3",
    <>
      {"  "}
      <span className="lc-c">{"// contributions · your task"}</span>
    </>,
    "ghost",
  ],
  [
    "4",
    <>
      {"  "}
      <span className="lc-k">function</span> <span className="lc-f">fund</span>
      <span className="lc-p">()</span> <span className="lc-k">public</span> <span className="lc-k">payable</span>{" "}
      <span className="lc-p">{"{ … }"}</span>
    </>,
  ],
  [
    "5",
    <>
      <span className="lc-p">{"}"}</span>
    </>,
  ],
];

const CodeEx = () => (
  <div className="flex h-full flex-col justify-center overflow-hidden rounded-[10px] bg-code-bg py-3 font-mono text-[11px] leading-[1.7] text-code-plain">
    {CODE_LINES.map(([num, line, mark]) => (
      <div
        key={num}
        className={cn(
          "flex whitespace-pre px-4",
          mark === "hl" && "bg-lp-code-highlight-bg shadow-[inset_3px_0_0_var(--color-lilac)]",
          mark === "ghost" && "italic opacity-75",
        )}
      >
        <span className="w-5 shrink-0 pr-3.5 text-right text-code-comment">{num}</span>
        <span>{line}</span>
      </div>
    ))}
  </div>
);

const ExerciseEx = () => (
  <div className="flex h-full flex-col gap-2.5">
    <p className="m-0 text-[12.5px] leading-snug text-lp-text-secondary">
      Declare a <span className="lp-inline-mono">public constant</span> <span className="lp-inline-mono">GOAL</span> set
      to <span className="lp-inline-mono">10 ether</span>.
    </p>
    <div className="rounded-[10px] bg-code-bg px-3.5 py-3 font-mono text-[12px] leading-none text-code-plain">
      <span className="lc-t">uint256</span> <span className="lc-k">public</span> <span className="lc-k">constant</span>{" "}
      GOAL <span className="lc-p">=</span> <span className="lc-n">10 ether</span>
      <span className="lc-p">;</span>
      <span className="ml-0.5 inline-block h-[13px] w-[2px] animate-pulse bg-lp-accent align-middle" />
    </div>
    <div className="mt-auto flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-buttons bg-lp-btn-bg px-3 py-1.5 text-[12px] font-bold text-pure-white">
        <PlayIcon className="h-3 w-3" />
        Run
      </span>
      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-lp-positive">
        <CheckCircleIcon className="h-3.5 w-3.5" />1 / 1 passing
      </span>
    </div>
  </div>
);

const QUESTION_ANSWER = "In the contract. Only its code can move it.";

// The Question slide plays a tiny scripted loop whenever it becomes active:
// the learner "types" an answer, hits Check, and the tutor reviews it.
const QuestionEx = ({ active }: { active: boolean }) => {
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "checking" | "review">("typing");

  useEffect(() => {
    if (!active) {
      setTyped("");
      setPhase("typing");
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let i = 0;
    const typeNext = () => {
      i += 1;
      setTyped(QUESTION_ANSWER.slice(0, i));
      if (i < QUESTION_ANSWER.length) {
        timers.push(setTimeout(typeNext, 48));
      } else {
        timers.push(setTimeout(() => setPhase("checking"), 700));
        timers.push(setTimeout(() => setPhase("review"), 1550));
      }
    };
    timers.push(setTimeout(typeNext, 550));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="lp-bubble max-w-[94%] rounded-[13px] rounded-bl-buttons bg-lp-bubble-tutor px-3.5 py-2 text-[12.5px] leading-[1.5] text-lp-text-primary dark:border dark:border-dark-border-strong">
        After someone calls <code>fund()</code>, where does their ETH actually sit, and who can move it?
      </div>
      <div className="flex items-center rounded-[10px] border border-dashed border-lp-border px-3.5 py-2 text-[12px]">
        {typed ? (
          <span className="text-lp-text-primary">{typed}</span>
        ) : (
          <span className="text-lp-text-tertiary">Type your answer…</span>
        )}
        {phase === "typing" && (
          <span className="ml-0.5 inline-block h-[13px] w-[2px] animate-pulse bg-lp-accent align-middle" />
        )}
      </div>
      <span
        className={cn(
          "inline-flex items-center self-start gap-1.5 rounded-buttons px-3 py-1.5 text-[12px] font-bold transition-colors",
          phase === "checking" ? "bg-lp-btn-bg text-pure-white" : "border border-lp-ghost-border text-lp-text-primary",
        )}
      >
        {phase === "checking" ? "Checking…" : "Check answer"}
      </span>
      <div
        className={cn(
          "lp-bubble flex max-w-[94%] items-start gap-1.5 rounded-[13px] rounded-bl-buttons bg-lp-bubble-tutor px-3.5 py-2 text-[12.5px] leading-[1.5] text-lp-text-primary transition-all duration-300 dark:border dark:border-dark-border-strong",
          phase === "review" ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-1 opacity-0",
        )}
        aria-hidden={phase !== "review"}
      >
        <SparklesIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lp-accent" />
        <span>
          You identified both where the ETH sits and what controls when it can move. That&apos;s enough to continue.
        </span>
      </div>
    </div>
  );
};

const ExperimentEx = () => (
  <div className="flex h-full flex-col gap-2.5">
    <span className="inline-flex items-center self-start gap-1.5 rounded-buttons bg-lp-btn-bg px-3.5 py-2 text-[12.5px] font-bold text-pure-white">
      <RocketLaunchIcon className="h-3.5 w-3.5" />
      Deploy
    </span>
    <div className="flex-1 overflow-hidden rounded-[10px] bg-code-bg px-3.5 py-3 font-mono text-[11px] leading-[1.8]">
      <div className="text-code-comment">&gt; compiling CrowdFund.sol…</div>
      <div className="text-code-string">✓ deployed at 0x5FbD…0aA3</div>
      <div className="text-code-plain">&gt; gas used 412,033</div>
    </div>
  </div>
);

const TutorEx = () => (
  <div className="flex h-full flex-col justify-center gap-2">
    <div className="lp-bubble max-w-[94%] rounded-[13px] rounded-bl-buttons bg-lp-bubble-tutor px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-lp-text-primary dark:border dark:border-dark-border-strong">
      Your <code>refund()</code> reverts. What should <code>contributions[msg.sender]</code> be at this point?
    </div>
    <div className="max-w-[94%] self-end rounded-[13px] rounded-br-buttons border border-lp-bubble-you-border bg-lp-surface px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-lp-text-primary">
      The amount they put in?
    </div>
    <div className="lp-bubble max-w-[94%] rounded-[13px] rounded-bl-buttons bg-lp-bubble-tutor px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-lp-text-primary dark:border dark:border-dark-border-strong">
      Right. So if you send the ETH first and zero it out after, what could a malicious contract do in between?
    </div>
  </div>
);

type Slide = {
  key: string;
  label: string;
  short: string;
  icon: ComponentType<{ className?: string }>;
  slug: string;
  title: string;
  body: string;
  example: ComponentType<{ active: boolean }>;
};

const SLIDES: Slide[] = [
  {
    key: "tutor",
    label: "AI Tutor",
    short: "AI Tutor",
    icon: SparklesIcon,
    slug: "socratic-tutor",
    title: "A question, not the answer",
    body: "Stuck on any card? The Socratic tutor asks the one question that gets you unstuck.",
    example: TutorEx,
  },
  {
    key: "concept",
    label: "Concept",
    short: "Concept",
    icon: LightBulbIcon,
    slug: "the-world-computer",
    title: "Understand it first",
    body: "Plain-language ideas with visuals (the world computer, gas, reentrancy) before any code.",
    example: ConceptEx,
  },
  {
    key: "code",
    label: "Code",
    short: "Code",
    icon: CodeBracketIcon,
    slug: "read-the-contract",
    title: "Read real Solidity",
    body: "The whole contract in one place. The faded lines are the ones you'll fill in yourself.",
    example: CodeEx,
  },
  {
    key: "exercise",
    label: "Code Exercise",
    short: "Exercise",
    icon: PencilSquareIcon,
    slug: "declare-the-goal",
    title: "Write it yourself",
    body: "One line at a time, checked against a live EVM the moment you run it.",
    example: ExerciseEx,
  },
  {
    key: "question",
    label: "Question",
    short: "Question",
    icon: ChatBubbleLeftRightIcon,
    slug: "where-does-eth-sit",
    title: "Prove you get it",
    body: "Short prompts that test the idea, not the syntax, in your own words.",
    example: QuestionEx,
  },
  {
    key: "experiment",
    label: "Experiment",
    short: "Experiment",
    icon: RocketLaunchIcon,
    slug: "deploy-it",
    title: "Deploy and use it",
    body: "One click compiles and deploys your contract to an in-browser chain. Then inspect the transaction, address, and gas used.",
    example: ExperimentEx,
  },
];

export const HeroShowcase = () => {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    const tick = (t: number) => {
      if (last === null) last = t;
      const dt = t - last;
      last = t;
      if (!pausedRef.current) {
        elapsedRef.current += dt;
        if (elapsedRef.current >= DWELL) {
          elapsedRef.current = 0;
          setActive(a => (a + 1) % SLIDES.length);
          setProgress(0);
        } else {
          setProgress(elapsedRef.current / DWELL);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const jump = (i: number) => {
    elapsedRef.current = 0;
    setProgress(0);
    setActive(i);
  };

  const current = SLIDES[active];

  return (
    <div
      className="overflow-hidden rounded-cards border border-lp-border bg-lp-surface shadow-labshot"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      aria-label="A tour of the card types in a Learning Lab"
    >
      <div className="flex items-center gap-2 border-b border-lp-border bg-lp-band px-3.5 py-[11px]">
        <span className="flex shrink-0 gap-1.5" aria-hidden>
          <i className="h-[11px] w-[11px] rounded-full bg-lp-shot-dots" />
          <i className="h-[11px] w-[11px] rounded-full bg-lp-shot-dots" />
          <i className="h-[11px] w-[11px] rounded-full bg-lp-shot-dots" />
        </span>
        <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-lp-border bg-lp-shot-url-bg px-3 py-1 font-mono text-xs text-lp-text-secondary">
          Learning Lab · ethereum-101 / {current.slug}
        </span>
      </div>

      <div className="relative h-[352px]">
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          const Example = slide.example;
          return (
            <div
              key={slide.key}
              className={cn(
                "absolute inset-0 flex flex-col gap-2.5 p-6 transition-all duration-500",
                i === active ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-3 opacity-0",
              )}
              aria-hidden={i !== active}
            >
              <span className="inline-flex items-center self-start gap-1.5 rounded-[7px] bg-lp-eyebrow-bg px-[9px] py-1 text-[11px] font-bold uppercase text-lp-accent">
                <Icon className="h-3 w-3" />
                {slide.label}
              </span>
              <h4 className="mt-1 mb-0 text-[22px] font-black leading-[1.1] text-lp-text-primary">{slide.title}</h4>
              <p className="m-0 text-[13.5px] leading-[1.55] text-lp-text-secondary">{slide.body}</p>
              <div className="min-h-0 flex-1">
                <Example active={i === active} />
              </div>
            </div>
          );
        })}

        {/* auto-advance indicator: a line that fills along the stage's bottom seam */}
        <span
          className="absolute bottom-0 left-0 h-[2px] bg-lp-accent"
          style={{ width: `${progress * 100}%` }}
          aria-hidden
        />
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-lp-border bg-lp-band px-3 py-2.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => jump(i)}
            aria-label={`Show ${slide.label} card`}
            aria-current={i === active}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
              i === active ? "bg-lp-eyebrow-bg text-lp-accent" : "text-lp-text-tertiary hover:text-lp-text-secondary",
            )}
          >
            {slide.short}
          </button>
        ))}
      </div>
    </div>
  );
};
