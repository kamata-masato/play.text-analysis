import type { Hint } from '../../models/hint.js'
import type { Note } from '../../models/note.js'
import type { Finder } from '../finder.js'
import resolve from './supports/line.js'

/**
 * 定義文の文末判定に使用する文末表現の一覧
 *
 * 「は」は特異性が低く定義以外にも広くマッチするため、この文末表現リストが精度の要となる
 * 長い表現を先に列挙することで正規表現の最長一致を実現する
 */
const ENDINGS =
  'のことである|のことです|のこと|を意味します|を意味する|を指します|を指す|の略称です|の略称|の略です|の略|である|です'

/**
 * 「Xは<comma?>Y」パターンを検出する正規表現
 *
 * 文末列挙型のみ。読点トリガー型は設けない
 */
const PATTERN = new RegExp(
  `(?:^|[\n。、])(?<name>[^\n。、]+?)は[、]?(?<description>[^\n。]*?(?:${ENDINGS}))`,
  'g',
)

/**
 * 本文の「XはY」パターンから用語候補を検出する Finder
 *
 * 「は」をトリガーとする定義文パターンを検出する
 * 「とは」と比べて特異性が低く、定義以外の文にも広くマッチする
 */
class HaInBodyFinder implements Finder {
  /**
   * Note の text を走査して「Xは」パターンの Hint を返す
   *
   * @param note - 走査対象のノートを指定する
   * @returns 見つかった Hint の配列を返す
   */
  find = (note: Note): Hint[] => {
    const hints: Hint[] = []
    const pattern = new RegExp(PATTERN.source, PATTERN.flags)

    let matched: RegExpExecArray | null
    while ((matched = pattern.exec(note.text)) !== null) {
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
        name: matched.groups!['name']!,
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

export default HaInBodyFinder
