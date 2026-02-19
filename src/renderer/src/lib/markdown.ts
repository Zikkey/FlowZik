/**
 * Lightweight markdown → HTML parser.
 * Supports: **bold**, *italic*, `code`, ```code blocks```,
 * # headings (h1-h3), - lists, > blockquotes, [text](url), line breaks.
 * XSS-safe: escapes HTML entities before parsing.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseInline(line: string): string {
  return line
    // inline code (must be before bold/italic)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // links — only allow safe protocols (http, https, mailto)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
      const trimmed = url.trim().toLowerCase()
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:')) {
        // Sanitize URL: prevent encoded quotes from breaking out of href attribute
        const safeUrl = url.replace(/&quot;/g, '%22').replace(/&amp;/g, '%26').replace(/&lt;/g, '%3C').replace(/&gt;/g, '%3E')
        return `<a href="${safeUrl}" target="_blank" rel="noopener">${text}</a>`
      }
      return `<a rel="noopener">${text}</a>`
    })
}

export function parseMarkdown(text: string): string {
  if (!text) return ''

  const escaped = escapeHtml(text)
  const lines = escaped.split('\n')
  const html: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      html.push(`<pre><code>${codeLines.join('\n')}</code></pre>`)
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      html.push(`<h3>${parseInline(line.slice(4))}</h3>`)
      i++
      continue
    }
    if (line.startsWith('## ')) {
      html.push(`<h2>${parseInline(line.slice(3))}</h2>`)
      i++
      continue
    }
    if (line.startsWith('# ')) {
      html.push(`<h1>${parseInline(line.slice(2))}</h1>`)
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('&gt; ') || line === '&gt;') {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('&gt; ') || lines[i] === '&gt;')) {
        quoteLines.push(lines[i].replace(/^&gt; ?/, ''))
        i++
      }
      html.push(`<blockquote>${quoteLines.map(parseInline).join('<br/>')}</blockquote>`)
      continue
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      html.push(`<ul>${items.map((it) => `<li>${parseInline(it)}</li>`).join('')}</ul>`)
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Regular paragraph
    html.push(`<p>${parseInline(line)}</p>`)
    i++
  }

  return html.join('')
}
