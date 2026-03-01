import type { Evidence } from './evidence.js'

/**
 * スコア付与前の見込み
 *
 * Bundler が同じ用語を指す Evidence をグルーピングして生成する
 */
type Prospect = {
  /**
   * 用語テキスト
   *
   * Bundler が最初の Evidence の用語名から空白を除去して設定する
   */
  name: string
  /**
   * この見込みを裏付ける証拠の一覧
   */
  evidence: Evidence[]
}

/**
 * スコア付与後の確定した概念
 *
 * Scorer が閾値を超えた Prospect から生成し、Publisher が成果物に変換する
 */
type Concept = {
  /**
   * 用語テキスト
   */
  name: string
  /**
   * この概念を裏付ける証拠の一覧
   */
  evidence: Evidence[]
  /**
   * スコア
   *
   * Scorer がこの概念の妥当性を表す数値を設定する
   * 閾値を超えた Prospect から生成するため、常に正の数になる
   */
  score: number
  /**
   * 説明文
   *
   * 得られなかった場合は空文字を設定する
   * Publisher は空文字の場合ホバー対象にしない
   */
  description: string
}

export type { Prospect, Concept }
