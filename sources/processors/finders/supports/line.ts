import type { Note } from '../../../models/note.js'

/**
 * プレーンテキスト内のオフセットからソースファイルの行番号を解決する
 *
 * Origin 一覧を二分探索し、オフセット以下で最大のエントリの行番号を返す
 * origins が1件以上含まれていることを前提とする
 *
 * @param note - 対象のノートを指定する
 * @param offset - プレーンテキスト内の文字オフセットを指定する
 * @returns ソースファイルの行番号を返す
 */
const resolve = (note: Note, offset: number): number => {
  const { origins } = note
  let low = 0
  let high = origins.length - 1

  while (low <= high) {
    const middle = (low + high) >>> 1
    if (origins[middle]!.offset <= offset) {
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  return origins[high]!.line
}

export default resolve
