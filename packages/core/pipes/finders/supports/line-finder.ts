import type { Note } from '../../../models/note.js'

const find = (note: Note, offset: number): number => {
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

const LineFinder = {
  find,
}

export { LineFinder }
