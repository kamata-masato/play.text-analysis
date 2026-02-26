import type { Notebook } from '../../models/note.js'

type Parser = {
  extensions(): string[]
  parse(source: string, content: string): Notebook
}

export type { Parser }
