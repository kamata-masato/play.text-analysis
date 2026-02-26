import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from './finder.js'
import { EnglishCharacterPattern, JapaneseCharacterPattern } from './supports/lexicons/languages.js'
import { AliasIdentifierPattern } from './supports/lexicons/phrases.js'
import { LineFinder } from './supports/line-finder.js'
import { type Parenthesis, ParenthesisFinder } from './supports/parenthesis-finder.js'

class JapaneseSupplementInParenthesesFinder implements Finder {
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []

    for (const parenthesis of ParenthesisFinder.find(note.text)) {
      if (!this.qualifies(parenthesis)) {
        continue
      }

      hints.push({
        name: parenthesis.outside.trim(),
        description: parenthesis.inside.trim(),
        span: parenthesis.span,
        line: LineFinder.find(note, parenthesis.span.offset),
      })
    }

    return hints
  }

  private qualifies = (parenthesis: Parenthesis): boolean => {
    const { outside, inside } = parenthesis

    if (
      JapaneseCharacterPattern.test(outside) &&
      !JapaneseCharacterPattern.test(inside) &&
      EnglishCharacterPattern.test(inside)
    ) {
      return false
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
      return false
    }

    if (
      AliasIdentifierPattern.test(trimmed.inside) &&
      !AliasIdentifierPattern.test(trimmed.outside) &&
      trimmed.outside.length > trimmed.inside.length
    ) {
      return false
    }

    if (
      !JapaneseCharacterPattern.test(trimmed.outside) &&
      !JapaneseCharacterPattern.test(trimmed.inside)
    ) {
      return false
    }

    return true
  }
}

export { JapaneseSupplementInParenthesesFinder }
