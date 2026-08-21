"use client";

// Shared host for a static illustration asset. Each lab illustration is just a
// configured instance — image + alt — so they all share the same inline
// framing: full reading-column width, rounded. Pair the returned component with
// a card's `illustrations` list; it renders inline in the card body (see
// ConceptCard / ExperimentCard), not the rail.
import { useRef } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";

type IllustrationConfig = {
  src: string;
  alt: string;
  width: number;
  height: number;
  unoptimized?: boolean;
  loading?: "eager" | "lazy";
};

export const makeIllustration = ({
  src,
  alt,
  width,
  height,
  unoptimized = false,
  loading = "lazy",
}: IllustrationConfig) => {
  // children, when present, are pinned as an overlay over the image — that's
  // where ConceptCard parks the "open interactive" button.
  const Illustration = ({ children }: { children?: ReactNode }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const inlineImage = (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full rounded-xl border border-lab-border"
        unoptimized={unoptimized}
        loading={loading}
      />
    );

    if (children != null) {
      return (
        <figure className="relative m-0 w-full">
          {inlineImage}
          {children}
        </figure>
      );
    }

    return (
      <figure className="relative m-0 w-full">
        <button
          type="button"
          className="group relative block w-full cursor-zoom-in rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-violet focus-visible:ring-offset-2 focus-visible:ring-offset-lab-surface"
          onClick={() => dialogRef.current?.showModal()}
          aria-label={`Open full-size image: ${alt}`}
        >
          {inlineImage}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full border border-lab-border bg-lab-surface/90 text-lab-text opacity-90 shadow-md transition-transform group-hover:scale-105 group-focus-visible:scale-105 sm:bottom-3 sm:right-3"
          >
            <ArrowsPointingOutIcon className="h-5 w-5" />
          </span>
        </button>

        <dialog
          ref={dialogRef}
          className="modal p-2 sm:p-6"
          aria-label={`Full-size image: ${alt}`}
          onCancel={event => {
            event.preventDefault();
            dialogRef.current?.close();
          }}
          onKeyDown={event => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            dialogRef.current?.close();
          }}
          onClick={event => {
            if (event.target !== event.currentTarget) return;
            dialogRef.current?.close();
          }}
        >
          <div className="modal-box flex h-auto max-h-none w-auto max-w-none flex-col items-end gap-2 overflow-visible bg-transparent p-0 shadow-none">
            <div className="z-10 flex w-full items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-circle h-11 min-h-11 w-11 border-lab-border bg-lab-surface/95 text-lab-text shadow-lg hover:border-lab-violet hover:text-lab-violet"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close full-size image"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="h-auto max-h-[calc(100dvh-4.5rem)] w-auto max-w-[calc(100vw-1rem)] touch-manipulation rounded-xl object-contain shadow-2xl sm:max-h-[calc(100dvh-6.5rem)] sm:max-w-[calc(100vw-3rem)]"
              unoptimized
              loading={loading}
            />
          </div>
          <form className="modal-backdrop">
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close full-size image">
              close
            </button>
          </form>
        </dialog>
      </figure>
    );
  };
  Illustration.displayName = "Illustration";
  return Illustration;
};
