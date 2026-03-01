import type { Hint } from './hint.js'
import type { Note } from './note.js'
import type { Rule } from './rule.js'

/**
 * 手がかりとその出所
 *
 * Finder の戻り値に Rule と Note を付加して組み立てる
 */
type Evidence = {
  /**
   * この手がかりを発見したルール
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
