'use client';

import { useMemo, useRef } from 'react';
import { Copy01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, cn, toast } from '@workspace/ui';

import { useCopyToClipboard } from '~/hooks/use-copy-to-clipboard';

function getTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children))
    return children.map(getTextFromChildren).join('');
  if (children != null && typeof children === 'object' && 'props' in children) {
    const el = children as React.ReactElement<{ children?: React.ReactNode }>;
    return getTextFromChildren(el.props.children);
  }
  return '';
}

type CodeBlockProps = {
  className?: string;
  children?: React.ReactNode;
  raw?: string;
  language?: string;
};

export function CodeBlock({
  className,
  children,
  raw,
  language
}: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const { copy, copied } = useCopyToClipboard();

  const text = useMemo(
    () => raw ?? getTextFromChildren(children),
    [raw, children]
  );

  const handleCopy = async () => {
    if (!text) return;
    await copy(text);
    toast.success('Copiado!');
  };

  const langLabel = language?.replace(/^language-/, '') ?? '';

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border bg-muted/50">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5">
        {langLabel ? (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {langLabel}
          </span>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={handleCopy}
          aria-label={copied ? 'Copiado' : 'Copiar código'}
        >
          <HugeiconsIcon
            icon={Copy01Icon}
            size={14}
          />
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </div>
      <pre
        ref={preRef}
        className={cn(
          'overflow-x-auto p-4 text-sm font-mono leading-relaxed',
          className
        )}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}
