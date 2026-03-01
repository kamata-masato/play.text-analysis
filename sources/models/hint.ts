import type { Span } from './note.js'

/**
 * Finder が Note 内で見つけた手がかり1件
 *
 * パイプラインの中で Evidence に組み立てられ、Bundler、Scorer を経て Publisher に渡される
 */
type Hint = {
  /**
   * 用語候補のテキスト
   */
  name: string
  /**
   * 説明文
   *
   * Finder が説明文を取得できた場合に設定する
   * Scorer が最適な説明文の選定に使用する
   */
  description?: string
  /**
   * ノート内での出現位置
   *
   * プレーンテキスト内にマッチ位置がある Finder が設定する
   */
  span?: Span
  /**
   * ソースファイル内の行番号
   *
   * Publisher がアンカーリンクの id 生成と着地先の特定に使用する
   */
  line: number
}

export type { Hint }
