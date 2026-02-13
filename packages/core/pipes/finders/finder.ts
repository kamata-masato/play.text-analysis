import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'

type Finder = {
  find(note: Note): Hint[]
}

export type { Finder }
