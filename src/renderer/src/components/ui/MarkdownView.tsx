import { useMemo } from 'react'
import { parseMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'

interface MarkdownViewProps {
  text: string
  className?: string
}

export function MarkdownView({ text, className }: MarkdownViewProps) {
  const html = useMemo(() => parseMarkdown(text), [text])

  if (!text) return null

  return (
    <div
      className={cn('markdown-body', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
