import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import HaInBodyFinder from '../../../sources/processors/finders/ha-in-body-finder.js'

const finder = new HaInBodyFinder()

describe('HaInBodyFinder', () => {
  describe('find', () => {
    it('「Xは〜です」の形式から Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '移植性は、異なるOSやコンピュータでも同じように動作することです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('移植性')
      expect(hints[0]?.description).toBe('異なるOSやコンピュータでも同じように動作することです')
    })

    it('「Xは〜である」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'カーネルはOSの中核部分である',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カーネル')
      expect(hints[0]?.description).toBe('OSの中核部分である')
    })

    it('「Xは〜のこと」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスは実行中のプログラムのこと',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
    })

    it('「Xは〜を指す」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'スレッドは軽量なプロセスを指す',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
    })

    it('複数のパターンを検出する', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスは実行中のプログラムです。スレッドは軽量なプロセスです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('プロセス')
      expect(hints[1]?.name).toBe('スレッド')
    })

    it('文末表現にマッチしない「は」の文にはマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'これは問題がある',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('span を正しく設定する', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'カーネルはOSの中核部分です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('カーネル')
    })

    it('name の左端を読点で区切る', () => {
      const note: Note = {
        source: 'inline.md',
        text: '重要な概念として、移植性は動作の互換性です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.name).toBe('移植性')
    })

    it('テキストが空の場合は空配列を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('「とは」を含む文にもマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'シグナルハンドラとは実行される関数です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints.length).toBeGreaterThanOrEqual(1)
    })
  })
})
