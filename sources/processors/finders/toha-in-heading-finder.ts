import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from '../finder.js'

/**
 * 見出しの「Xとは」パターンから用語候補を検出する
 */
const PATTERN = /^(?<name>.+?)とは[?？]?$/

/**
 * 見出しに「Xとは」を含むノートから用語候補を検出する Finder
 *
 * Note の headings の末尾の見出しを参照し、「Xとは」パターンにマッチすれば Hint を返す
 * 本文テキストを description として付与する
 */
class TohaInHeadingFinder implements Finder {
  /**
   * Note の末尾の見出しを走査して「Xとは」パターンの Hint を返す
   *
   * headings が undefined の場合は空配列を返す
   * 末尾の見出しのみを対象とする
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find = (note: Note): Hint[] => {
    if (note.headings === undefined) {
      return []
    }

    const target = note.headings[note.headings.length - 1]
    if (target === undefined) {
      return []
    }

    const matched = target.text.match(PATTERN)
    if (matched === null || matched.groups === undefined) {
      return []
    }

    const hint: Hint = {
      name: matched.groups['name']!,
      line: target.line,
    }

    if (note.text.trim() !== '') {
      hint.description = note.text
    }

    return [hint]
  }
}

export default TohaInHeadingFinder
