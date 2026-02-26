import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from './finder.js'

const TohaInHeadingPattern = new RegExp('^(?<name>.+?)とは[?？]?$')

class TohaInHeadingFinder implements Finder {
  find = (note: Note): Hint[] => {
    if (note.headings === undefined) {
      return []
    }

    const heading = note.headings[note.headings.length - 1]
    if (heading === undefined) {
      return []
    }

    const matched = heading.text.match(TohaInHeadingPattern)
    if (matched === null || matched.groups === undefined) {
      return []
    }

    const hint: Hint = {
      name: matched.groups['name']!,
      line: heading.line,
    }

    if (note.text.trim() !== '') {
      hint.description = note.text
    }

    return [hint]
  }
}

export { TohaInHeadingFinder }
