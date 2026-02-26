import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from './finder.js'
import { UniversalDelimiterText } from './supports/lexicons/boundaries.js'
import { JapaneseEndingText } from './supports/lexicons/phrases.js'
import { LineFinder } from './supports/line-finder.js'

const HaInBodyPattern = new RegExp(
  `(?:^|[${UniversalDelimiterText}])(?<name>[^${UniversalDelimiterText}]+?)は[、]?(?<description>[^\n。]*?(?:${JapaneseEndingText}))`,
  'g',
)

class HaInBodyFinder implements Finder {
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []

    const cursor = new RegExp(HaInBodyPattern.source, HaInBodyPattern.flags)
    let matched: RegExpExecArray | null
    while ((matched = cursor.exec(note.text)) !== null) {
      let description = matched.groups!['description']!
      let text = matched[0]
      let offset = matched.index

      if (offset < note.text.length && UniversalDelimiterText.includes(note.text[offset]!)) {
        text = text.slice(1)
        offset += 1
      }

      description = description.trim()

      const hint: Hint = {
        name: matched.groups!['name']!,
        span: { text, offset },
        line: LineFinder.find(note, offset),
      }

      if (description !== '') {
        hint.description = description
      }

      hints.push(hint)
    }

    return hints
  }
}

export { HaInBodyFinder }
