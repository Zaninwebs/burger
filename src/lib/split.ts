/**
 * Teilt Text eines Elements in Wörter, die jeweils in einer Maske liegen.
 * Screenreader lesen weiterhin den Originaltext (aria-label).
 * Gibt die inneren Spans zurück, die animiert werden.
 */
export function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.splitDone) return Array.from(el.querySelectorAll<HTMLElement>('.split-line > span'))
  const text = el.textContent ?? ''
  el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim())
  const out: HTMLElement[] = []
  const walk = (node: Node, target: HTMLElement) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/)
        parts.forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) {
            target.appendChild(document.createTextNode(' '))
            return
          }
          const mask = document.createElement('span')
          mask.className = 'split-line'
          mask.style.display = 'inline-block'
          mask.setAttribute('aria-hidden', 'true')
          const inner = document.createElement('span')
          inner.textContent = part
          mask.appendChild(inner)
          target.appendChild(mask)
          out.push(inner)
        })
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = (child as HTMLElement).cloneNode(false) as HTMLElement
        if (clone.tagName === 'BR') {
          target.appendChild(clone)
          return
        }
        clone.setAttribute('aria-hidden', 'true')
        target.appendChild(clone)
        walk(child, clone)
      }
    })
  }
  const frag = document.createElement('span')
  walk(el, frag)
  el.replaceChildren(...Array.from(frag.childNodes))
  el.dataset.splitDone = '1'
  return out
}
