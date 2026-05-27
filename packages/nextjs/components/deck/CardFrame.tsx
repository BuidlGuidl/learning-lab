import type { Card } from "~~/lib/deck/types";

type Props = {
  card: Card;
  children: React.ReactNode;
};

export const CardFrame = ({ card, children }: Props) => {
  return (
    <div className="card bg-base-100 shadow-lg w-full max-w-3xl">
      <div className="card-body">
        <span className="badge badge-primary font-mono uppercase text-xs tracking-wider mb-2 self-start">
          {card.label}
        </span>
        <h2 className="card-title text-2xl mb-4">{card.title}</h2>
        {children}
      </div>
    </div>
  );
};
