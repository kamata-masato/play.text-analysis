import type { Concept } from '../models/concept.js'
import type { Notebook } from '../models/note.js'

/**
 * 確定したデータから成果物を生成する処理者のインターフェース
 *
 * Concept の確定データを成果物の形式に変換するだけであり、name や description の決定は行わない
 */
type Publisher = {
  /**
   * 成果物を生成して出力先に書き出す
   *
   * @param notebooks - 全ファイルの Notebook を指定する
   * @param concepts - Scorer が確定した Concept の配列を指定する
   * @param destination - 成果物の出力先ディレクトリパスを指定する
   * @returns 書き出し完了を表す Promise を返す
   */
  publish(notebooks: Notebook[], concepts: Concept[], destination: string): Promise<void>
}

export type { Publisher }
