import type { Hint } from './hint.js'
import type { Note } from './note.js'
import type { Rule } from './rule.js'

type Evidence = {
  rule: Rule
  note: Note
  hint: Hint
}

export type { Evidence }
