import type { Span } from './note.js'

type Hint = {
  name: string
  description?: string
  span?: Span
  line: number
}

export type { Hint }
