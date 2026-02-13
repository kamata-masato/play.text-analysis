import type { Concept, Prospect } from '../../models/concept.js'

type Scorer = {
  score(prospects: Prospect[]): Concept[]
}

export type { Scorer }
