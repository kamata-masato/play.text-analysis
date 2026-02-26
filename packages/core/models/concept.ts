import type { Evidence } from './evidence.js'

type Prospect = {
  name: string
  evidences: Evidence[]
}

type Concept = {
  name: string
  description: string
  evidences: Evidence[]
  score: number
}

export type { Prospect, Concept }
