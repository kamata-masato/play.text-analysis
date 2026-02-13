import type { Heading as MdastHeading, Root, RootContent } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { Emphasis, Note, Notebook, Origin } from '../../models/note.js'
import type { Parser } from './parser.js'

type TraversalState = {
  buffer: string[]
  offset: number
  origins: Origin[]
  emphases: Emphasis[]
}

type Heading = {
  depth: number
  text: string
  line: number
}

type RawNote = {
  heading: MdastHeading | null
  nodes: RootContent[]
}

const YamlFrontmatterPattern = new RegExp('^---\\n[\\s\\S]*?\\n---\\n?')

const KramdownBlockAttributePattern = new RegExp('^\\{:.*\\}\\s*$', 'gm')

const KramdownInlineAttributePattern = new RegExp('[ \\t]*\\{[#:][^}]*\\}', 'g')

class MarkdownParser implements Parser {
  extensions = (): string[] => ['.md', '.markdown']

  parse = (source: string, content: string): Notebook => {
    const cleaned = this.preprocess(content)

    if (cleaned.trim() === '') {
      return { source, notes: [], raw: cleaned }
    }

    const processor = unified().use(remarkParse).use(remarkGfm)
    const tree = processor.parse(cleaned)

    const fragments = this.split(tree)
    const notes = this.build(source, fragments)

    return { source, notes, raw: cleaned }
  }

  private split = (tree: Root): RawNote[] => {
    const fragments: RawNote[] = []

    let current: RawNote = { heading: null, nodes: [] }
    for (const node of tree.children) {
      if (node.type === 'heading') {
        if (current.heading !== null || current.nodes.length > 0) {
          fragments.push(current)
        }

        current = { heading: node, nodes: [] }
      } else {
        current.nodes.push(node)
      }
    }

    if (current.heading !== null || current.nodes.length > 0) {
      fragments.push(current)
    }

    return fragments
  }

  private build = (source: string, fragments: RawNote[]): Note[] => {
    const notes: Note[] = []

    const stack: Heading[] = []
    for (const fragment of fragments) {
      if (fragment.heading !== null) {
        const line = fragment.heading.position?.start.line ?? 0
        const title = this.extract(fragment.heading.children as RootContent[])
        const depth = fragment.heading.depth

        while (stack.length > 0 && (stack[stack.length - 1]?.depth ?? 0) >= depth) {
          stack.pop()
        }

        stack.push({ depth, text: title, line })
      }

      const state: TraversalState = {
        buffer: [],
        offset: 0,
        origins: [],
        emphases: [],
      }

      for (const node of fragment.nodes) {
        this.visit(node, state, false)
      }

      const text = state.buffer.join('')
      const note: Note = {
        source,
        text,
        origins: state.origins,
      }

      if (fragment.heading !== null) {
        note.headings = stack.map((heading) => ({
          depth: heading.depth,
          text: heading.text,
          line: heading.line,
        }))
      }

      if (state.emphases.length > 0) {
        note.emphases = state.emphases
      }

      notes.push(note)
    }

    return notes
  }

  private extract = (children: RootContent[]): string => {
    const parts: string[] = []

    for (const child of children) {
      if (child.type === 'text') {
        parts.push(child.value)
      } else if (child.type === 'inlineCode') {
        parts.push(child.value)
      } else if ('children' in child) {
        parts.push(this.extract(child.children as RootContent[]))
      }
    }

    return parts.join('')
  }

  private visit = (node: RootContent, state: TraversalState, nested: boolean): void => {
    switch (node.type) {
      case 'paragraph': {
        this.separate(state)

        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }

        break
      }

      case 'blockquote': {
        this.separate(state)

        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }

        break
      }

      case 'list': {
        this.separate(state)

        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }

        break
      }

      case 'listItem': {
        this.separate(state)

        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }

        break
      }

      case 'table': {
        this.separate(state)

        this.flatten(node, state)

        break
      }

      case 'text': {
        this.append(node.value, node.position?.start.line ?? 0, state)

        break
      }

      case 'inlineCode': {
        this.append(node.value, node.position?.start.line ?? 0, state)

        break
      }

      case 'strong': {
        if (!nested) {
          const start = state.offset
          const mark = state.buffer.length

          for (const child of node.children) {
            this.visit(child as RootContent, state, true)
          }

          const captured = state.buffer.slice(mark).join('')
          state.emphases.push({
            span: { text: captured, offset: start },
            kind: 'strong',
          })
        } else {
          for (const child of node.children) {
            this.visit(child as RootContent, state, true)
          }
        }

        break
      }

      case 'emphasis': {
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }

        break
      }

      case 'delete': {
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }

        break
      }

      case 'link': {
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }

        break
      }

      case 'image': {
        if (node.alt) {
          this.append(node.alt, node.position?.start.line ?? 0, state)
        }

        break
      }

      case 'code':
      case 'html':
      case 'thematicBreak': {
        break
      }

      default: {
        if ('children' in node) {
          for (const child of (node as { children: RootContent[] }).children) {
            this.visit(child, state, nested)
          }
        }

        break
      }
    }
  }

  private flatten = (node: { children: RootContent[] }, state: TraversalState): void => {
    for (const [index, row] of node.children.entries()) {
      if (index > 0) {
        this.pad('\n', state)
      }

      if (row && 'children' in row) {
        const cells = (row as { children: RootContent[] }).children
        for (const [position, cell] of cells.entries()) {
          if (position > 0) {
            this.pad(' ', state)
          }
          if (cell && 'children' in cell) {
            for (const child of (cell as { children: RootContent[] }).children) {
              this.visit(child, state, false)
            }
          }
        }
      }
    }
  }

  private separate = (state: TraversalState): void => {
    if (state.buffer.length > 0) {
      this.pad('\n', state)
    }
  }

  private append = (segment: string, line: number, state: TraversalState): void => {
    const previous = state.origins[state.origins.length - 1]
    if (previous === undefined || previous.line !== line) {
      state.origins.push({ offset: state.offset, line })
    }

    state.buffer.push(segment)
    state.offset += segment.length
  }

  private pad = (segment: string, state: TraversalState): void => {
    state.buffer.push(segment)
    state.offset += segment.length
  }

  private preprocess = (content: string): string => {
    let cleaned = content
    cleaned = cleaned.replace(YamlFrontmatterPattern, (matched) =>
      '\n'.repeat((matched.match(/\n/g) ?? []).length),
    )
    cleaned = cleaned.replace(KramdownBlockAttributePattern, '')
    cleaned = cleaned.replace(KramdownInlineAttributePattern, '')

    return cleaned
  }
}

export { MarkdownParser }
