import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from './finder.js'
import { LineFinder } from './supports/line-finder.js'

const AbbreviationAfterColonPattern = new RegExp(
  '(?<abbreviation>[A-Z][A-Z0-9./-]+)\\s*[:：]\\s*(?<fullname>[A-Za-z][A-Za-z0-9 ./-]+)',
  'g',
)

class AbbreviationAfterColonFinder implements Finder {
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []

    const cursor = new RegExp(
      AbbreviationAfterColonPattern.source,
      AbbreviationAfterColonPattern.flags,
    )
    let matched: RegExpExecArray | null
    while ((matched = cursor.exec(note.text)) !== null) {
      hints.push({
        name: matched.groups!['abbreviation']!,
        description: matched.groups!['fullname']!,
        span: { text: matched[0], offset: matched.index },
        line: LineFinder.find(note, matched.index),
      })
    }

    return hints
  }
}

export { AbbreviationAfterColonFinder }
