'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  content: string;
}

function PreBlock({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);

  const getCode = (): string => {
    if (!children) return '';
    const child = Array.isArray(children) ? children[0] : children;
    if (child && typeof child === 'object' && 'props' in child) {
      const code = (child as React.ReactElement<{ children?: React.ReactNode }>).props.children;
      return typeof code === 'string' ? code : String(code ?? '');
    }
    return String(children);
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(getCode().replace(/\n$/, '')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="code-block-wrapper">
      <button
        className="code-copy-btn"
        onClick={handleCopy}
        aria-label="Kopírovat kód"
      >
        {copied ? (
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" /> Zkopírováno
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Copy className="h-3 w-3" /> Kopírovat
          </span>
        )}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}

function LectureImage({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? ''} style={{ maxWidth: '100%', height: 'auto' }} />;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose-lecture">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => url}
        components={{
          pre: PreBlock,
          img: LectureImage,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
