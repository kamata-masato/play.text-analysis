import type { Element, ElementContent, Root as HastRoot } from 'hast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import type { Transcriber } from './transcriber.js'

const HeadingPattern = new RegExp('^h[1-6]$')

const promote = (tree: HastRoot): void => {
  for (const node of tree.children) {
    if (node.type !== 'element' || !HeadingPattern.test(node.tagName)) {
      continue
    }

    const meaningful = node.children.filter(
      (child) => !(child.type === 'text' && child.value.trim() === ''),
    )

    if (meaningful.length !== 1 || meaningful[0]?.type !== 'element') {
      continue
    }

    const element = meaningful[0] as Element

    if (element.tagName !== 'a') {
      continue
    }

    const href = String(element.properties?.href ?? '')

    if (!href.startsWith('#') || href.length <= 1) {
      continue
    }

    node.properties = { ...node.properties, id: href.slice(1) }
    node.children = element.children as ElementContent[]
  }
}

class MarkdownTranscriber implements Transcriber {
  transcribe = async (raw: string): Promise<HastRoot> => {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(raw)
    const hast = (await unified().use(remarkRehype).run(tree)) as HastRoot

    promote(hast)

    return hast
  }
}

export { MarkdownTranscriber }
