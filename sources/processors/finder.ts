import type { Hint } from '../models/hint.js'
import type { Note } from '../models/note.js'

/**
 * Note から Hint を見つける処理者のインターフェース
 *
 * ルールごとに実装クラスを用意する
 * 各 Finder は BuiltinRules と1対1で対応する
 */
type Finder = {
  /**
   * Note を走査して手がかりを見つける
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find(note: Note): Hint[]
}

export type { Finder }
