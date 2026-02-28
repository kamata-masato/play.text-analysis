import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from '../finder.js'
import resolve from './supports/line.js'

/**
 * 文末表現の一覧
 *
 * 長い表現を先に列挙することで正規表現の最長一致を実現する
 */
const ENDINGS =
  'のことである|のことです|のこと|を意味します|を意味する|を指します|を指す|の略称です|の略称|の略です|の略|である|です'

/**
 * パターン1: 文末列挙型
 *
 * 「Xとは[、]?Y」の形式で Y が特定の文末表現で終わるパターンを検出する
 */
const PATTERN_ONE = new RegExp(
  `(?:^|[\n。、])(?<name>[^\n。、]+?)とは[、]?(?<description>[^\n。]*?(?:${ENDINGS}))`,
  'g',
)

/**
 * パターン2: 読点トリガー型
 *
 * 「Xとは、Y」の形式で Y が句点・改行・末尾まで続くパターンを検出する
 */
const PATTERN_TWO = /(?:^|[\n。、])(?<name>[^\n。、]+?)とは、(?<description>[^。\n]+)/g

/**
 * 本文の「Xとは〜です」パターンから用語候補を検出する Finder
 *
 * 文末列挙型と読点トリガー型の2パターンで検出する
 * 重複時はパターン1を優先する
 */
class TohaInBodyFinder implements Finder {
  /**
   * Note の text を走査して「Xとは」パターンの Hint を返す
   *
   * パターン1の結果を優先し、パターン2はオフセットが重複しないもののみ採用する
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find = (note: Note): Hint[] => {
    const primary = this.scan(note, PATTERN_ONE)
    const secondary = this.scan(note, PATTERN_TWO)

    /**
     * パターン1の span.offset を集合に格納し、重複判定に使用する
     */
    const covered = new Set(primary.map((hint) => hint.span!.offset))

    const hints = [...primary]
    for (const hint of secondary) {
      if (!covered.has(hint.span!.offset)) {
        hints.push(hint)
      }
    }

    return hints
  }

  /**
   * 指定した正規表現でテキストを走査し Hint の配列を返す
   *
   * マッチの先頭が区切り文字の場合はスキップして name と offset を調整する
   *
   * @param note - 走査対象のノートを指定する
   * @param source - 走査に使用する正規表現を指定する
   * @returns 見つかった Hint の配列を返す
   */
  private scan = (note: Note, source: RegExp): Hint[] => {
    const hints: Hint[] = []
    const pattern = new RegExp(source.source, source.flags)

    let matched: RegExpExecArray | null
    while ((matched = pattern.exec(note.text)) !== null) {
      const name = matched.groups!['name']!
      let description = matched.groups!['description']!
      let text = matched[0]
      let offset = matched.index

      /**
       * マッチの先頭が区切り文字の場合はスキップする
       */
      if (offset < note.text.length && '\n。、'.includes(note.text[offset]!)) {
        text = text.slice(1)
        offset += 1
      }

      description = description.trim()

      const hint: Hint = {
        name,
        span: { text, offset },
        line: resolve(note, offset),
      }

      if (description !== '') {
        hint.description = description
      }

      hints.push(hint)
    }

    return hints
  }
}

export default TohaInBodyFinder
