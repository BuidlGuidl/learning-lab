"use client";

// Shared host for a static illustration asset. Each lab illustration is just a
// configured instance — image + alt — so they all share the same inline
// framing: full reading-column width, rounded. Pair the returned component with
// a card's `illustrations` list; it renders inline in the card body (see
// ConceptCard / ExperimentCard).
import Image from "next/image";

type IllustrationConfig = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const makeIllustration = ({ src, alt, width, height }: IllustrationConfig) => {
  const Illustration = () => (
    <figure className="m-0 w-full">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full rounded-xl border border-lab-border"
        priority={false}
      />
    </figure>
  );
  Illustration.displayName = "Illustration";
  return Illustration;
};
