import type { Concept, Prospect } from '../../models/concept.js'
import type { Monitor } from '../../pipelines/pipeline.js'

type Scorer = {
  score(prospects: Prospect[], monitor?: Monitor): Concept[] | Promise<Concept[]>
}

export type { Scorer }
