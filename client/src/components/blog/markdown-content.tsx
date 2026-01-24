'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="font-display text-4xl font-bold text-text-primary mt-8 mb-4">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-display text-3xl font-bold text-text-primary mt-8 mb-4">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-display text-2xl font-bold text-text-primary mt-6 mb-3">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="font-display text-xl font-bold text-text-primary mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="text-text-primary mb-4 leading-relaxed">{children}</p>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-text-primary ml-4">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-text-primary ml-4">{children}</ol>
  ),
  li: ({ children }: any) => <li className="ml-2">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 italic text-text-secondary my-4">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }: any) => {
    if (inline) {
      return (
        <code className="bg-background border border-border-default rounded px-1 py-0.5 text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block bg-background border border-border-default rounded-lg p-4 overflow-x-auto my-4">
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => (
    <pre className="bg-background border border-border-default rounded-lg p-4 overflow-x-auto my-4">
      {children}
    </pre>
  ),
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
