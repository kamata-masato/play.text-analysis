import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from '../finder.js'
import resolve from './supports/line.js'
import { ABBREVIATION, aliased, detect } from './supports/parentheses.js'

/**
 * 括弧内の別名から用語候補を検出する Finder
 *
 * 日英ペアと略称展開の2パターンを検出する
 * 日英ペアは括弧の外が日本語、中が英語の場合である
 * 略称展開は一方が大文字英字の略称、もう一方が正式名称の場合である
 */
class AliasInParenthesesFinder implements Finder {
  /**
   * Note の text を走査して括弧内の別名の Hint を返す
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []

    for (const matched of detect(note.text)) {
      if (!aliased(matched.outside, matched.inside)) {
        continue
      }

      const outside = matched.outside.trim()
      const inside = matched.inside.trim()

      /**
       * 略称展開の場合は略称側を name、正式名称側を description とする
       */
      if (ABBREVIATION.test(outside)) {
        hints.push({
          name: outside,
          description: inside,
          span: { text: matched.text, offset: matched.offset },
          line: resolve(note, matched.offset),
        })
      } else if (ABBREVIATION.test(inside)) {
        hints.push({
          name: inside,
          description: outside,
          span: { text: matched.text, offset: matched.offset },
          line: resolve(note, matched.offset),
        })
      } else {
        /**
         * 日英ペアの場合は日本語側を name、英語側を description とする
         */
        hints.push({
          name: matched.outside,
          description: matched.inside,
          span: { text: matched.text, offset: matched.offset },
          line: resolve(note, matched.offset),
        })
      }
    }

    return hints
  }
}

export default AliasInParenthesesFinder
