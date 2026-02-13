import { cpSync, existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Root as HastRoot } from 'hast'
import type { Schema } from 'hast-util-sanitize'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { unified } from 'unified'
import type { Concept } from '../../models/concept.js'
import type { Notebook } from '../../models/note.js'
import type { Publisher } from './publisher.js'
import type { Anchor } from './supports/html-annotator.js'
import { HtmlAnnotator, IdentifierClassName } from './supports/html-annotator.js'
import { LinkRewriter } from './supports/link-rewriter.js'
import type { Transcriber } from './transcribers/transcriber.js'

type EmbeddedConcept = {
  description: string
  links: { label: string; href: string }[]
}

const FileExtensionPattern = new RegExp('\\.[^.]+$')

const SanitizeSchema: Schema = {
  ...defaultSchema,
  clobberPrefix: '',
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className', IdentifierClassName],
      'dataGlossaConcept',
      'id',
    ],
    ...Object.fromEntries(
      (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((tag) => [
        tag,
        [...(defaultSchema.attributes?.[tag] ?? []), 'id'],
      ]),
    ),
  },
}

const htmlify = (source: string): string => source.replace(FileExtensionPattern, '.html')

const encode = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

class HtmlPublisher implements Publisher {
  constructor(private transcriber: Transcriber) {}

  publish = async (
    notebooks: Notebook[],
    concepts: Concept[],
    destination: string,
  ): Promise<void> => {
    const accepted = concepts.filter((concept) => concept.description !== '')

    const anchors = this.anchors(accepted)
    const names = accepted.map((concept) => concept.name).sort((a, b) => b.length - a.length)
    const available = new Set(notebooks.map((notebook) => notebook.source))

    this.deploy(destination)

    for (const notebook of notebooks) {
      const body = await this.render(notebook.raw, names, anchors, notebook.source, available)
      const embedded = this.embed(notebook, accepted)
      const html = this.html(notebook.source, body, embedded)
      const location = join(destination, htmlify(notebook.source))

      await mkdir(dirname(location), { recursive: true })
      await writeFile(location, html, 'utf-8')
    }
  }

  private render = async (
    raw: string,
    names: string[],
    anchors: Map<string, Anchor>,
    source: string,
    available: Set<string>,
  ): Promise<string> => {
    const tree = await this.transcriber.transcribe(raw)
    LinkRewriter.rewrite(tree, source, available)
    const annotated = HtmlAnnotator.annotate(tree, names, anchors)

    const processor = unified().use(rehypeSanitize, SanitizeSchema).use(rehypeStringify)

    return String(processor.stringify((await processor.run(annotated)) as HastRoot))
  }

  private embed = (notebook: Notebook, concepts: Concept[]): string => {
    const embedded: Record<string, EmbeddedConcept> = {}

    for (const concept of concepts.filter((concept) => notebook.raw.includes(concept.name))) {
      embedded[concept.name] = {
        description: concept.description,
        links: this.links(concept, notebook.source),
      }
    }

    if (Object.keys(embedded).length === 0) {
      return ''
    }

    const serialized = JSON.stringify(embedded).replace(/</g, '\\u003c')

    return `<script>\n  window.__GLOSSA_CONCEPTS__ = ${serialized};\n</script>`
  }

  private anchors = (concepts: Concept[]): Map<string, Anchor> => {
    const anchors = new Map<string, Anchor>()

    for (const concept of concepts) {
      const lines = new Set<number>()

      for (const evidence of concept.evidences) {
        if (evidence.hint.description !== undefined) {
          lines.add(evidence.hint.line)
        }
      }

      if (lines.size > 0) {
        anchors.set(concept.name, { lines })
      }
    }

    return anchors
  }

  private links = (concept: Concept, current: string): EmbeddedConcept['links'] => {
    const seen = new Set<string>()
    const links: EmbeddedConcept['links'] = []

    for (const evidence of concept.evidences) {
      if (evidence.hint.description === undefined) {
        continue
      }

      const key = `${evidence.note.source}\0${evidence.hint.line}`

      if (seen.has(key)) {
        continue
      }

      seen.add(key)

      const href =
        posix.relative(dirname(htmlify(current)), htmlify(evidence.note.source)) +
        `#${IdentifierClassName}-${concept.name}-${evidence.hint.line}`
      const label = `📄 ${evidence.note.source}:${evidence.hint.line}`

      links.push({ label, href })
    }

    return links
  }

  private html = (source: string, body: string, embedded: string): string => {
    const relative = htmlify(source)
    const depth = relative.split('/').length - 1
    const prefix = depth > 0 ? '../'.repeat(depth) : './'
    const title = source.replace(FileExtensionPattern, '').split('/').pop() ?? ''

    const parts = [
      '<!DOCTYPE html>',
      '<html lang="ja">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      `  <title>${encode(title)}</title>`,
      `  <link rel="stylesheet" href="${prefix}assets/tooltip-style.css">`,
      '</head>',
      '<body>',
      `  <main>${body}</main>`,
    ]

    if (embedded !== '') {
      parts.push(`  ${embedded}`)
    }

    parts.push(`  <script src="${prefix}assets/tooltip-script.js"></script>`)
    parts.push('</body>')
    parts.push('</html>')

    return parts.join('\n')
  }

  private deploy = (destination: string): void => {
    const resolved = fileURLToPath(new URL('./assets', import.meta.url))

    cpSync(
      existsSync(resolved) ? resolved : resolved.replace('/distributions/', '/'),
      join(destination, 'assets'),
      { recursive: true },
    )
  }
}

export { HtmlPublisher }
