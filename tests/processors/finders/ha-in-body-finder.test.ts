import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import HaInBodyFinder from '../../../sources/processors/finders/ha-in-body-finder.js'

describe('HaInBodyFinder', () => {
  describe('find', () => {
    it('「Xは〜です」の形式から Hint を返す', () => {
      const finder = new HaInBodyFinder()
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
      const finder = new HaInBodyFinder()
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
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスは実行中のプログラムのこと',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
    })

    it('「Xは〜を指す」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'スレッドは軽量なプロセスを指す',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
    })

    it('複数のパターンを検出する', () => {
      const finder = new HaInBodyFinder()
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
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'これは問題がある',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('span を正しく設定する', () => {
      const finder = new HaInBodyFinder()
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
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: '重要な概念として、移植性は動作の互換性です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.name).toBe('移植性')
    })

    it('テキストが空の場合は空配列を返す', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('「Xは〜のことである」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'カーネルはOSの中核部分のことである',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('のことである')
    })

    it('「Xは〜のことです」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'カーネルはOSの中核部分のことです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('のことです')
    })

    it('「Xは〜を意味します」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: '冪等性は同じ操作を何度実行しても結果が変わらないことを意味します',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を意味します')
    })

    it('「Xは〜を意味する」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: '冪等性は同じ操作を何度実行しても結果が変わらないことを意味する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を意味する')
    })

    it('「Xは〜を指します」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'スレッドは軽量なプロセスを指します',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を指します')
    })

    it('「Xは〜の略称です」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'APIはApplication Programming Interfaceの略称です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略称です')
    })

    it('「Xは〜の略称」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'APIはApplication Programming Interfaceの略称',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略称')
    })

    it('「Xは〜の略です」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'APIはApplication Programming Interfaceの略です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略です')
    })

    it('「Xは〜の略」の形式にマッチする', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'APIはApplication Programming Interfaceの略',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略')
    })

    it('hint.line を正しく設定する', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'カーネルはOSの中核部分です',
        origins: [{ offset: 0, line: 7 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.line).toBe(7)
    })

    it('複数 Origin で後半のパターンの line を正しく解決する', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: 'inline.md',
        text: '前半のテキスト。カーネルはOSの中核部分です',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 15 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カーネル')
      expect(hints[0]?.line).toBe(15)
    })

    it('「とは」を含む文にもマッチする', () => {
      const finder = new HaInBodyFinder()
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
