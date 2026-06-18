"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "~~/components/code/CodeBlock";

// Element styling for lesson prose. react-markdown owns block layout, so callers
// pass their text styling (color, size, block margin) via `className` on the
// wrapper instead of wrapping this in their own <p>.
const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-lab-violet underline underline-offset-2 transition-colors hover:text-lab-iris"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-base-300 pl-3 italic text-base-content/70 last:mb-0">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => <h3 className="mb-2 mt-1 text-xl font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-1 text-lg font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-1 text-base font-semibold">{children}</h4>,
  // DaisyUI's table component restores the borders/padding Tailwind preflight strips.
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="table table-zebra table-sm">{children}</table>
    </div>
  ),
  // Inline code gets a chip. Fenced solidity routes through the same shiki
  // CodeBlock the code cards use, so lesson prose and code reveals highlight
  // identically; any other language stays a plain panel (the highlighter only
  // loads solidity — see components/code/highlighter.ts). The fenced branches
  // own their outer margin because `pre` below is a transparent pass-through.
  code: ({ className, children }) => {
    const lang = className?.match(/language-(\w+)/)?.[1];
    if (!lang) {
      return (
        <code className="rounded bg-base-300 px-1.5 py-0.5 font-mono text-[0.85em] text-base-content">{children}</code>
      );
    }
    const code = String(children).replace(/\n$/, "");
    if (lang === "solidity") {
      return (
        <div className="mb-3 last:mb-0">
          <CodeBlock code={code} lang="solidity" />
        </div>
      );
    }
    return (
      <pre className="mb-3 overflow-x-auto rounded-md bg-base-300 p-3 font-mono text-[0.85em] leading-relaxed last:mb-0">
        <code>{code}</code>
      </pre>
    );
  },
  // Fenced code renders its own block (above); pre just passes through —
  // wrapping it would nest a block inside a <pre> and double the margin.
  pre: ({ children }) => <>{children}</>,
};

// Inline variant unwraps the paragraph so formatting drops into a host line
// (e.g. after a "Hint:" label) without introducing a block break.
const inlineComponents: Components = { ...components, p: ({ children }) => <>{children}</> };

type Props = {
  children: string;
  className?: string;
  inline?: boolean;
};

export const Markdown = ({ children, className, inline = false }: Props) => {
  if (inline) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
        {children}
      </ReactMarkdown>
    );
  }
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};
