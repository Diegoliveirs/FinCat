"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const md: Components = {
  p: ({ children }) => <p className="my-1.5 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-muted">{children}</em>,
  ul: ({ children }) => <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h1 className="mt-2 mb-1 text-base font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-2 mb-1 text-[15px] font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-bold">{children}</h3>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code
          className={`bg-bg/70 block rounded-lg px-3 py-2 font-mono text-[12.5px] whitespace-pre ${className ?? ""}`}
        >
          {children}
        </code>
      );
    }
    return <code className="text-brand rounded bg-white/10 px-1 py-0.5 font-mono text-[12.5px]">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-bg/70 my-2 overflow-x-auto rounded-lg border border-white/10 p-0">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-brand/50 text-muted my-2 border-l-2 pl-3">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-white/10" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-[12.5px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
  th: ({ children }) => <th className="border-b border-white/10 px-2.5 py-1.5 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-white/5 px-2.5 py-1.5">{children}</td>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
      {children}
    </ReactMarkdown>
  );
}
