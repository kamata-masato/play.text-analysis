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
   * Bundler が最初の Evidence の用語名を trim して設定する
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
   * デバッグ分析やレビュー用途で参照する
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
