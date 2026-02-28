import type { Hint } from './hint.js'
import type { Note } from './note.js'
import type { Rule } from './rule.js'

/**
 * 手がかりとその出所情報
 *
 * Finder の戻り値である Hint に rule と note を付加して組み立てる
 */
type Evidence = {
  /**
   * この手がかりを発見したルール名
   */
  rule: Rule
  /**
   * 手がかりが発見されたノート
   */
  note: Note
  /**
   * 発見された手がかり
   */
  hint: Hint
}

export type { Evidence }
