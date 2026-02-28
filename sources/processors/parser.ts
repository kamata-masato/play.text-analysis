import type { Notebook } from '../models/note.js'

/**
 * ファイルを解析して Notebook を生成する処理者のインターフェース
 *
 * 入力形式ごとに実装クラスを用意する
 */
type Parser = {
  /**
   * ファイルを解析して Notebook を生成する
   *
   * ファイル I/O は呼び出し側の責務であり、Parser は純粋な変換関数として副作用を持たない
   *
   * @param source - ファイルパスを指定する
   * @param content - ファイルの中身の文字列を指定する
   * @returns 解析結果の Notebook を返す
   */
  parse(source: string, content: string): Notebook
}

export type { Parser }
