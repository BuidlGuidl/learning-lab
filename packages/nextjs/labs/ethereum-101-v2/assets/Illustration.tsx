"use client";

// Shared host for a static illustration asset. Each lab illustration is just a
// configured instance — image + alt — so they all share the same inline
// framing: full reading-column width, rounded. Pair the returned component with
// a card's `illustrations` list; it renders inline in the card body (see
// ConceptCard / ExperimentCard), not the rail.
import type { ReactNode } from "react";
import Image from "next/image";

type IllustrationConfig = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const makeIllustration = ({ src, alt, width, height }: IllustrationConfig) => {
  // children, when present, are pinned as an overlay over the image — that's
  // where ConceptCard parks the "open interactive" button.
  const Illustration = ({ children }: { children?: ReactNode }) => (
    <figure className="relative m-0 w-full">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full rounded-xl border border-lab-border"
        priority={false}
      />
      {children}
    </figure>
  );
  Illustration.displayName = "Illustration";
  return Illustration;
};
