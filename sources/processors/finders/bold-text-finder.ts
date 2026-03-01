import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from '../finder.js'
import resolve from './supports/line.js'

/**
 * 太字テキストから用語候補を検出する Finder
 *
 * Note 内の太字を Hint として返す
 */
class BoldTextFinder implements Finder {
  /**
   * Note の太字を走査して Hint を返す
   *
   * 太字がない場合は空配列を返す
   * 空白のみの太字はスキップする
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find = (note: Note): Hint[] => {
    if (note.emphases === undefined) {
      return []
    }

    const hints: Hint[] = []
    for (const emphasis of note.emphases) {
      if (emphasis.kind !== 'strong') {
        continue
      }
      if (emphasis.span.text.trim() === '') {
        continue
      }
      hints.push({
        name: emphasis.span.text,
        span: emphasis.span,
        line: resolve(note, emphasis.span.offset),
      })
    }
    return hints
  }
}

export default BoldTextFinder
