type Span = {
  text: string
  offset: number
}

type EmphasisKind = 'strong'

type Emphasis = {
  span: Span
  kind: EmphasisKind
}

type Heading = {
  depth: number
  text: string
  line: number
}

type Origin = {
  offset: number
  line: number
}

type Note = {
  source: string
  text: string
  origins: Origin[]
  headings?: Heading[]
  emphases?: Emphasis[]
}

type Notebook = {
  source: string
  notes: Note[]
  raw: string
}

export type { Span, EmphasisKind, Emphasis, Heading, Origin, Note, Notebook }
