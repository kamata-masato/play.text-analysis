import type { Concept } from '../../models/concept.js'
import type { Notebook } from '../../models/note.js'

type Publisher = {
  publish(notebooks: Notebook[], concepts: Concept[], destination: string): Promise<void>
}

export type { Publisher }
