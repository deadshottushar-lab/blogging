import { escapeHtml } from './utils.js'

/**
 * Minimal, safe Markdown renderer.
 * Returns an HTML string with every user-supplied character escaped first,
 * so post content can never inject markup or scripts.
 */

function inline(text) {
  let out = escapeHtml(text)

  // Inline code first so other rules don't touch its contents.
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Images: ![alt](src)
  out = out.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" />',
  )
  // Links: [text](href) — only http(s) and mailto allowed.
  out = out.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  )
  // Bold / italic / strike.
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  return out
}

function renderBlocks(source) {
  const lines = String(source || '').replace(/\r\n/g, '\n').split('\n')
  const html = []
  let paragraph = []
  let quote = []
  let codeLang = null
  let code = []
  let tableRows = []

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }
  const closeList = () => {
    if (listTag) {
      const items = listItems.map((item) => `<li>${inline(item)}</li>`).join('')
      html.push(`<${listTag}>${items}</${listTag}>`)
      listItems = []
      listTag = null
    }
  }
  const flushQuote = () => {
    if (quote.length) {
      html.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`)
      quote = []
    }
  }
  const flushTable = () => {
    if (tableRows.length) {
      const [head, ...body] = tableRows
      const headHtml = head
        .map((cell) => `<th>${inline(cell)}</th>`)
        .join('')
      const bodyHtml = body
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`,
        )
        .join('')
      html.push(
        `<div class="table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`,
      )
      tableRows = []
    }
  }

  let listTag = null
  let listItems = []
  let inCode = false

  for (const raw of lines) {
    const line = raw

    // Fenced code blocks.
    if (/^```/.test(line.trim())) {
      if (!inCode) {
        flushParagraph(); closeList(); flushQuote(); flushTable()
        inCode = true
        codeLang = line.trim().slice(3).trim() || null
        code = []
      } else {
        inCode = false
        const cls = codeLang ? ` class="lang-${escapeHtml(codeLang)}"` : ''
        html.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`)
        codeLang = null
        code = []
      }
      continue
    }
    if (inCode) {
      code.push(line)
      continue
    }

    // Headings.
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushParagraph(); closeList(); flushQuote(); flushTable()
      const level = heading[1].length
      html.push(`<h${level + 1}>${inline(heading[2])}</h${level + 1}>`)
      continue
    }

    // Horizontal rule.
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
      flushParagraph(); closeList(); flushQuote(); flushTable()
      html.push('<hr />')
      continue
    }

    // Blockquote.
    if (/^\s*>\s?/.test(line)) {
      flushParagraph(); closeList(); flushTable()
      quote.push(line.replace(/^\s*>\s?/, ''))
      continue
    }

    // Table rows.
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushParagraph(); closeList(); flushQuote()
      const cells = line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())
      // Separator row (| --- | --- |) — drop it, the first row is the header.
      if (cells.every((cell) => /^:?-{2,}:?$/.test(cell))) continue
      tableRows.push(cells)
      continue
    } else if (tableRows.length) {
      flushTable()
    }

    // Ordered list.
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (ordered) {
      flushParagraph(); flushQuote(); flushTable()
      if (listTag !== 'ol') {
        closeList()
        listTag = 'ol'
      }
      listItems.push(ordered[1])
      continue
    }

    // Unordered list.
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line)
    if (bullet) {
      flushParagraph(); flushQuote(); flushTable()
      if (listTag !== 'ul') {
        closeList()
        listTag = 'ul'
      }
      listItems.push(bullet[1])
      continue
    }

    // Blank line ends any open block.
    if (!line.trim()) {
      flushParagraph(); closeList(); flushQuote(); flushTable()
      continue
    }

    closeList()
    paragraph.push(line.trim())
  }

  if (inCode) {
    html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
  }
  flushParagraph()
  closeList()
  flushQuote()
  flushTable()

  return html.join('\n')
}

/** Render post content to a sanitized HTML string. */
export function renderMarkdown(source) {
  return renderBlocks(source)
}
