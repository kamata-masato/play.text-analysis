import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from './finder.js'
import { LineFinder } from './supports/line-finder.js'

class BoldTextFinder implements Finder {
  find = (note: Note): Hint[] => {
    if (note.emphases === undefined) {
      return []
    }

    const hints: Hint[] = []
    for (const emphasis of note.emphases) {
      if (emphasis.span.text.trim() === '') {
        continue
      }

      hints.push({
        name: emphasis.span.text,
        span: emphasis.span,
        line: LineFinder.find(note, emphasis.span.offset),
      })
    }

    return hints
  }
}

export { BoldTextFinder }
