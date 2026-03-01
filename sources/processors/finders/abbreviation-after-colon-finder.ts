import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from '../finder.js'
import resolve from './supports/line.js'

/**
 * コロン区切りの略称展開パターンを検出する正規表現
 */
const PATTERN =
  /(?<abbreviation>[A-Z][A-Z0-9./-]+)\s*[:：]\s*(?<fullname>[A-Za-z][A-Za-z0-9 ./-]+)/g

/**
 * コロン区切りの略称展開から用語候補を検出する Finder
 *
 * 「X<colon>Y」の形式で X が英大文字略称、Y が英語の正式名称のパターンを検出する
 */
class AbbreviationAfterColonFinder implements Finder {
  /**
   * Note の text を走査してコロン区切りの略称展開の Hint を返す
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []
    const pattern = new RegExp(PATTERN.source, PATTERN.flags)

    let matched: RegExpExecArray | null
    while ((matched = pattern.exec(note.text)) !== null) {
      hints.push({
        name: matched.groups!['abbreviation']!,
        description: matched.groups!['fullname']!,
        span: { text: matched[0], offset: matched.index },
        line: resolve(note, matched.index),
      })
    }

    return hints
  }
}

export default AbbreviationAfterColonFinder
