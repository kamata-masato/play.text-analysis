/**
 * 括弧パターンの検出結果
 */
type ParenthesisMatch = {
  /**
   * 括弧の外側テキスト
   */
  outside: string
  /**
   * 括弧の内側テキスト
   */
  inside: string
  /**
   * マッチ全体のテキスト
   */
  text: string
  /**
   * マッチの開始オフセット
   */
  offset: number
}

/**
 * 括弧パターンを検出する正規表現
 *
 * outside の左端には改行・句点・読点と括弧文字を区切りとして使用する
 */
const PATTERN = /(?<outside>[^(\n。、（）()]+?)[（(](?<inside>[^）)]+)[）)]/g

/**
 * 日本語文字を検出する正規表現
 */
const JAPANESE = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]/

/**
 * 英大文字の略称を検出する正規表現
 */
const ABBREVIATION = /^[A-Z][A-Z0-9./-]+$/

/**
 * テキストから括弧パターンをすべて検出する
 *
 * @param text - 検出対象のテキストを指定する
 * @returns 検出した括弧パターンの配列を返す
 */
const detect = (text: string): ParenthesisMatch[] => {
  const results: ParenthesisMatch[] = []
  const pattern = new RegExp(PATTERN.source, PATTERN.flags)

  let matched: RegExpExecArray | null
  while ((matched = pattern.exec(text)) !== null) {
    const outside = matched.groups!['outside']!
    const inside = matched.groups!['inside']!

    if (outside.trim() === '' || inside.trim() === '') {
      continue
    }

    results.push({
      outside,
      inside,
      text: matched[0],
      offset: matched.index,
    })
  }

  return results
}

/**
 * 日英ペアかどうかを判定する
 *
 * outside が日本語を含み、inside が英語のみの場合に真を返す
 *
 * @param outside - 括弧の外側テキストを指定する
 * @param inside - 括弧の内側テキストを指定する
 * @returns 日英ペアの場合は true を返す
 */
const aliased = (outside: string, inside: string): boolean => {
  if (JAPANESE.test(outside) && !JAPANESE.test(inside) && /[A-Za-z]/.test(inside)) {
    return true
  }

  const trimmed = outside.trim()
  const inner = inside.trim()

  if (ABBREVIATION.test(trimmed) && !ABBREVIATION.test(inner) && inner.length > trimmed.length) {
    return true
  }
  if (ABBREVIATION.test(inner) && !ABBREVIATION.test(trimmed) && trimmed.length > inner.length) {
    return true
  }

  return false
}

export { detect, aliased, ABBREVIATION }
export type { ParenthesisMatch }
