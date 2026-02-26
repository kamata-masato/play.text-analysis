import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from './finder.js'
import { UniversalDelimiterText } from './supports/lexicons/boundaries.js'
import { JapaneseEndingText } from './supports/lexicons/phrases.js'
import { LineFinder } from './supports/line-finder.js'

const TohaInBodyByEndingPhrasePattern = new RegExp(
  `(?:^|[${UniversalDelimiterText}])(?<name>[^${UniversalDelimiterText}]+?)とは[、]?(?<description>[^\n。]*?(?:${JapaneseEndingText}))`,
  'g',
)

const TohaInBodyByCommaPattern = new RegExp(
  `(?:^|[${UniversalDelimiterText}])(?<name>[^${UniversalDelimiterText}]+?)とは、(?<description>[^。\n]+)`,
  'g',
)

class TohaInBodyFinder implements Finder {
  find = (note: Note): Hint[] => {
    const primary = this.scan(note, TohaInBodyByEndingPhrasePattern)
    const secondary = this.scan(note, TohaInBodyByCommaPattern)

    const covered = new Set(primary.map((hint) => hint.span!.offset))

    const hints = [...primary]
    for (const hint of secondary) {
      if (!covered.has(hint.span!.offset)) {
        hints.push(hint)
      }
    }

    return hints
  }

  private scan = (note: Note, source: RegExp): Hint[] => {
    const hints: Hint[] = []

    const cursor = new RegExp(source.source, source.flags)
    let matched: RegExpExecArray | null
    while ((matched = cursor.exec(note.text)) !== null) {
      const name = matched.groups!['name']!
      let description = matched.groups!['description']!
      let text = matched[0]
      let offset = matched.index

      if (offset < note.text.length && UniversalDelimiterText.includes(note.text[offset]!)) {
        text = text.slice(1)
        offset += 1
      }

      description = description.trim()

      const hint: Hint = {
        name,
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

export { TohaInBodyFinder }
