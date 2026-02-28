import type { Prospect } from '../../models/concept.js'
import type { Evidence } from '../../models/evidence.js'
import type { Bundler } from '../bundler.js'

/**
 * 用語名の正規化キーで Evidence をグルーピングする Bundler
 *
 * 正規化はグルーピングキーの生成にのみ使用し、出力の用語名には反映しない
 * 先頭助詞の除去はグルーピングキーと Prospect.name の両方に適用する
 */
class NameBundler implements Bundler {
  /**
   * 同じ用語を指す Evidence をグルーピングし、Prospect にまとめる
   *
   * @param evidence - 全 Finder が見つけた全 Evidence の配列を指定する
   * @returns グルーピングされた Prospect の配列を返す
   */
  bundle = (evidence: Evidence[]): Prospect[] => {
    const groups = new Map<string, Evidence[]>()

    for (const entry of evidence) {
      const key = this.normalize(entry.hint.name)
      const existing = groups.get(key)
      if (existing) {
        existing.push(entry)
      } else {
        groups.set(key, [entry])
      }
    }

    const prospects: Prospect[] = []
    for (const [, entries] of groups) {
      const first = entries[0]!
      prospects.push({
        name: this.strip(first.hint.name.trim()),
        evidence: entries,
      })
    }

    return prospects
  }

  /**
   * グルーピングキーを生成する
   *
   * trim、先頭助詞除去、全角半角変換、小文字化の順に正規化を行う
   *
   * @param name - 正規化対象の用語名を指定する
   * @returns 正規化されたグルーピングキーを返す
   */
  private normalize = (name: string): string => {
    let result = name.trim()
    result = this.strip(result)
    /** 全角英数字 → 半角英数字 */
    result = result.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xfee0),
    )
    /** 全角スペース → 半角スペース */
    result = result.replace(/\u3000/g, ' ')
    result = result.toLowerCase()
    return result
  }

  /**
   * 先頭の接続助詞を除去する
   *
   * 括弧パターンの正規表現の境界問題で付着した助詞を取り除く
   * 除去後に空文字になる場合は元の文字列をそのまま返す
   *
   * @param name - 除去対象の用語名を指定する
   * @returns 先頭助詞を除去した用語名を返す
   */
  private strip = (name: string): string => {
    const result = name.replace(/^[とや]/, '')
    return result === '' ? name : result
  }
}

export default NameBundler
