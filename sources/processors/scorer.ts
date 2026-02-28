import type { Concept, Prospect } from '../models/concept.js'

/**
 * Prospect にスコアを付けて Concept を生成する処理者のインターフェース
 *
 * スコアリングと description の選定は密結合であり、同一の処理で行う
 * 閾値を超えた Prospect のみが Concept として返される
 */
type Scorer = {
  /**
   * Prospect にスコアを付与し、閾値を超えたものを Concept として返す
   *
   * @param prospects - Bundler が生成した Prospect の配列を指定する
   * @returns 閾値を超えた Concept の配列を返す
   */
  score(prospects: Prospect[]): Concept[]
}

export type { Scorer }
