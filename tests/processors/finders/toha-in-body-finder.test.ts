import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import TohaInBodyFinder from '../../../sources/processors/finders/toha-in-body-finder.js'

const finder = new TohaInBodyFinder()

describe('TohaInBodyFinder', () => {
  describe('find - パターン1: 文末列挙型', () => {
    it('「Xとは〜です」の形式から Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'シグナルハンドラとは、シグナルを受け取ったときに実行される関数です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('シグナルハンドラ')
      expect(hints[0]?.description).toBe('シグナルを受け取ったときに実行される関数です')
    })

    it('「Xとは〜である」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'ミューテックスとは排他制御の仕組みである',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('ミューテックス')
      expect(hints[0]?.description).toBe('排他制御の仕組みである')
    })

    it('「Xとは〜のこと」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'コアダンプとはメモリの内容を保存したもののこと',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toBe('メモリの内容を保存したもののこと')
    })

    it('「Xとは〜を指す」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスとは実行中のプログラムを指す',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toBe('実行中のプログラムを指す')
    })

    it('「Xとは〜を意味する」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: '冪等性とは同じ操作を何度実行しても結果が変わらないことを意味する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toBe('同じ操作を何度実行しても結果が変わらないことを意味する')
    })

    it('「Xとは〜の略」の形式にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'APIとはApplication Programming Interfaceの略',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toBe('Application Programming Interfaceの略')
    })
  })

  describe('find - パターン2: 読点トリガー型', () => {
    it('「Xとは、Y。」の形式から Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'コアダンプとは、プロセスが異常終了したときにメモリの内容をファイルに保存したもの。次の文。',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('コアダンプ')
      expect(hints[0]?.description).toBe(
        'プロセスが異常終了したときにメモリの内容をファイルに保存したもの',
      )
    })

    it('「Xとは、Y」がテキスト末尾で終わる場合にマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'コアダンプとは、メモリの内容を保存したファイル',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toBe('メモリの内容を保存したファイル')
    })
  })

  describe('find - 優先制御', () => {
    it('パターン1とパターン2が重複する場合はパターン1を優先する', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'シグナルハンドラとは、シグナルを受け取ったときに実行される関数です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toBe('シグナルを受け取ったときに実行される関数です')
    })
  })

  describe('find - name の左端区切り', () => {
    it('読点で name を区切る', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスが異常終了したとき、コアダンプとは何かを理解することです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('コアダンプ')
    })

    it('句点で name を区切る', () => {
      const note: Note = {
        source: 'inline.md',
        text: '前の文。コアダンプとはメモリの保存です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('コアダンプ')
    })

    it('改行で name を区切る', () => {
      const note: Note = {
        source: 'inline.md',
        text: '前の文\nコアダンプとはメモリの保存です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('コアダンプ')
    })
  })

  describe('find - エッジケース', () => {
    it('「とはいえ」にはマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'そうとはいえ問題は残る',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('複数の「とは」パターンを検出する', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスとは実行中のプログラムです。スレッドとは軽量なプロセスです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('プロセス')
      expect(hints[1]?.name).toBe('スレッド')
    })

    it('テキストが空の場合は空配列を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('span を正しく設定する', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスとは実行中のプログラムです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('プロセス')
      expect(hints[0]?.span?.text).toContain('です')
    })

    it('「とは」の直後に改行がある場合は description を省略する', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスとは\n次の行の内容',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })
  })
})
