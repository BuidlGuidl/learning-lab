import type { Card } from "~~/lib/lab/types";

type Props = {
  card: Card;
  children: React.ReactNode;
};

const DROP_CAP_MIN_CHARS = 140;

const getDropCapText = (card: Card) => {
  switch (card.type) {
    case "concept":
    case "summary":
      return card.body;
    case "code":
      return card.note ?? "";
    default:
      return "";
  }
};

export const CardFrame = ({ card, children }: Props) => {
  const showDropCap = getDropCapText(card).trim().length >= DROP_CAP_MIN_CHARS;

  return (
    <div
      className={`lab-card w-full max-w-3xl overflow-hidden rounded-2xl border border-[color:var(--lab-paper-border)] bg-[var(--lab-paper-surface)] shadow-[var(--lab-paper-shadow)] ${
        showDropCap ? "lab-card--dropcap" : ""
      }`}
    >
      <div className="lab-card__body p-[clamp(24px,5vw,44px)] max-md:p-[22px] [&>p]:text-lg [&>p]:leading-[1.62] [&>p]:text-[var(--lab-paper-text)]">
        <span className="mb-[18px] inline-flex items-center self-start rounded-lg bg-[var(--lab-paper-tint)] px-3 py-1.5 font-mono text-xs font-bold uppercase text-[var(--lab-paper-violet)]">
          {card.label}
        </span>
        <h2 className="m-0 mb-5 text-[30px] font-black leading-[1.05] text-[var(--lab-paper-text)] md:text-[38px]">
          {card.title}
        </h2>
        {children}
      </div>
    </div>
  );
};
