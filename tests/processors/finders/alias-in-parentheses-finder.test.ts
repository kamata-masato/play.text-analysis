import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import AliasInParenthesesFinder from '../../../sources/processors/finders/alias-in-parentheses-finder.js'

const finder = new AliasInParenthesesFinder()

describe('AliasInParenthesesFinder', () => {
  describe('find - 日英ペア', () => {
    it('日本語（English）の形式から Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '認証（Authentication）はユーザーの身元を確認するプロセスです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('認証')
      expect(hints[0]?.description).toBe('Authentication')
    })

    it('半角括弧でもマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: '共有メモリ(shared memory)を使って通信する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('共有メモリ')
      expect(hints[0]?.description).toBe('shared memory')
    })

    it('span と line を正しく設定する', () => {
      const note: Note = {
        source: 'inline.md',
        text: '認証（Authentication）は重要です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('認証')
      expect(hints[0]?.span?.text).toContain('Authentication')
      expect(hints[0]?.line).toBe(1)
    })
  })

  describe('find - 略称展開', () => {
    it('略称（正式名称）の形式から Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'HTTP（HyperText Transfer Protocol）は通信プロトコルです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('HTTP')
      expect(hints[0]?.description).toBe('HyperText Transfer Protocol')
    })

    it('正式名称（略称）の形式でも略称を name にする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'Cross-Origin Resource Sharing（CORS）は仕組みです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('CORS')
      expect(hints[0]?.description).toBe('Cross-Origin Resource Sharing')
    })
  })

  describe('find - 非マッチ', () => {
    it('日本語（日本語）のパターンにはマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: '共有メモリ（データをコピーする必要がないので高速）を使って通信する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(0)
    })

    it('テキストが空の場合は空配列を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('複数のパターンを検出する', () => {
      const note: Note = {
        source: 'inline.md',
        text: '認証（Authentication）と認可（Authorization）は異なる概念です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('認証')
      expect(hints[1]?.name).toBe('と認可')
    })
  })
})
