import type { Prospect } from '../../models/concept.js'
import type { Evidence } from '../../models/evidence.js'

type Bundler = {
  bundle(evidences: Evidence[]): Prospect[]
}

export type { Bundler }
