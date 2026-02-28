import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from '../finder.js'
import resolve from './supports/line.js'
import { aliased, detect } from './supports/parentheses.js'

/**
 * 括弧内の日本語補足から用語候補を検出する Finder
 *
 * 括弧の外も中も日本語で、日英ペアでも略称展開でもないものを検出する
 * alias-in-parentheses の条件に合致しなかったものが対象となる
 */
class JapaneseSupplementInParenthesesFinder implements Finder {
  /**
   * Note の text を走査して括弧内の日本語補足の Hint を返す
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []

    for (const matched of detect(note.text)) {
      if (aliased(matched.outside, matched.inside)) {
        continue
      }

      hints.push({
        name: matched.outside,
        description: matched.inside,
        span: { text: matched.text, offset: matched.offset },
        line: resolve(note, matched.offset),
      })
    }

    return hints
  }
}

export default JapaneseSupplementInParenthesesFinder
