import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Evidence } from '../models/evidence.js'
import type { Notebook } from '../models/note.js'
import type { Rule } from '../models/rule.js'
import type { Bundler } from '../pipes/bundlers/bundler.js'
import type { Finder } from '../pipes/finders/finder.js'
import type { Parser } from '../pipes/parsers/parser.js'
import type { Publisher } from '../pipes/publishers/publisher.js'
import type { Scorer } from '../pipes/scorers/scorer.js'

abstract class Pipeline {
  constructor(
    private parser: Parser,
    private finders: Record<Rule, Finder>,
    private bundler: Bundler,
    private scorer: Scorer,
    private publisher: Publisher,
  ) {}

  run = async (sources: string[], destination: string): Promise<void> => {
    const notebooks: Notebook[] = []
    for (const source of sources) {
      const files = await this.explore(source)
      for (const file of files) {
        const content = await readFile(join(source, file), 'utf-8')
        notebooks.push(this.parser.parse(file, content))
      }
    }

    const evidences: Evidence[] = []
    for (const notebook of notebooks) {
      for (const note of notebook.notes) {
        for (const [rule, finder] of Object.entries(this.finders)) {
          for (const hint of finder.find(note)) {
            evidences.push({ rule: rule as Rule, note, hint })
          }
        }
      }
    }

    const prospects = this.bundler.bundle(evidences)
    const concepts = this.scorer.score(prospects)
    await this.publisher.publish(notebooks, concepts, destination)
  }

  private explore = async (directory: string): Promise<string[]> => {
    const files = await readdir(directory, { recursive: true })
    const suffixes = this.parser.extensions().map((extension) => extension.replace('.', '\\.'))
    const pattern = new RegExp(`(${suffixes.join('|')})$`)

    return files.filter((file) => pattern.test(file))
  }
}

export { Pipeline }
