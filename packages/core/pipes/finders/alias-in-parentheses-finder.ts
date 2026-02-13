import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from './finder.js'
import { EnglishCharacterPattern, JapaneseCharacterPattern } from './supports/lexicons/languages.js'
import { AliasIdentifierPattern } from './supports/lexicons/phrases.js'
import { LineFinder } from './supports/line-finder.js'
import { type Parenthesis, ParenthesisFinder } from './supports/parenthesis-finder.js'

class AliasInParenthesesFinder implements Finder {
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []

    for (const parenthesis of ParenthesisFinder.extract(note.text)) {
      const classified = this.classify(parenthesis)

      if (classified === null) {
        continue
      }

      hints.push({
        name: classified.name,
        description: classified.description,
        span: parenthesis.span,
        line: LineFinder.find(note, parenthesis.span.offset),
      })
    }

    return hints
  }

  private classify = (parenthesis: Parenthesis): { name: string; description: string } | null => {
    const { outside, inside } = parenthesis

    if (
      JapaneseCharacterPattern.test(outside) &&
      !JapaneseCharacterPattern.test(inside) &&
      EnglishCharacterPattern.test(inside)
    ) {
      return { name: outside.trim(), description: inside }
    }

    const trimmed = {
      outside: outside.trim(),
      inside: inside.trim(),
    }

    if (
      AliasIdentifierPattern.test(trimmed.outside) &&
      !AliasIdentifierPattern.test(trimmed.inside) &&
      trimmed.inside.length > trimmed.outside.length
    ) {
      return { name: trimmed.outside, description: trimmed.inside }
    }

    if (
      AliasIdentifierPattern.test(trimmed.inside) &&
      !AliasIdentifierPattern.test(trimmed.outside) &&
      trimmed.outside.length > trimmed.inside.length
    ) {
      return { name: trimmed.inside, description: trimmed.outside }
    }

    return null
  }
}

export { AliasInParenthesesFinder }
