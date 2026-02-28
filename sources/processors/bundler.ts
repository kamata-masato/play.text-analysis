import type { Prospect } from '../models/concept.js'
import type { Evidence } from '../models/evidence.js'

/**
 * Evidence をグルーピングし Prospect を生成する処理者のインターフェース
 *
 * グルーピングのキーと name の決定は密結合であり、同一の処理で行う
 */
type Bundler = {
  /**
   * 同じ用語を指す Evidence をグルーピングし、Prospect にまとめる
   *
   * @param evidence - 全 Finder が見つけた全 Evidence の配列を指定する
   * @returns グルーピングされた Prospect の配列を返す
   */
  bundle(evidence: Evidence[]): Prospect[]
}

export type { Bundler }
