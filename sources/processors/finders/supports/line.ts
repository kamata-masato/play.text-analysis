import type { Note } from '../../../models/note.js'

/**
 * note.text のオフセットからソースファイルの行番号を解決する
 *
 * note.origins を二分探索し、offset 以下で最大の Origin を見つけて line を返す
 *
 * @param note - 対象のノートを指定する
 * @param offset - note.text 内の文字オフセットを指定する
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
