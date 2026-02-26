import { describe, expect, it } from 'vitest'
import type { Note } from '../../../models/note.js'
import { AbbreviationAfterColonFinder } from '../../../pipes/finders/abbreviation-after-colon-finder.js'

describe('AbbreviationAfterColonFinder', () => {
  describe('find - コロン区切りの検出', () => {
    it('半角コロンの略称展開にマッチすること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'ESA: European Space Agency',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('ESA')
      expect(hints[0]?.description).toBe('European Space Agency')
      expect(hints[0]?.span?.text).toBe('ESA: European Space Agency')
      expect(hints[0]?.span?.offset).toBe(0)
    })

    it('全角コロンにもマッチすること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'NASA：National Aeronautics and Space Administration',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('NASA')
      expect(hints[0]?.description).toBe('National Aeronautics and Space Administration')
    })

    it('複数のパターンを検出すること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'ESA: European Space Agency\nNASA: National Aeronautics and Space Administration',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('ESA')
      expect(hints[1]?.name).toBe('NASA')
    })

    it('左側が小文字の場合はマッチしないこと', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'esa: European Space Agency',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('右側が日本語の場合はマッチしないこと', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'ISS: 国際宇宙ステーション',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('左側が日本語の場合はマッチしないこと', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: '軌道: Orbit',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('ソースファイルの行番号を正しく設定すること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'ESA: European Space Agency',
        origins: [{ offset: 0, line: 8 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.line).toBe(8)
    })

    it('行番号対応一覧で後半パターンの行番号を正しく解決すること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: '前半のテキスト\nNASA: National Aeronautics and Space Administration',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 12 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('NASA')
      expect(hints[0]?.line).toBe(12)
    })

    it('ドットを含む略称にマッチすること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'I.S.S: International Space Station',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('I.S.S')
    })

    it('ハイフンを含む略称にマッチすること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'LEO-1: Low Earth Orbit Satellite',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('LEO-1')
    })

    it('スラッシュを含む略称にマッチすること', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: 'E/M: Electromagnetic',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('E/M')
    })

    it('テキストが空の場合は空配列を返すこと', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: '宇宙開発.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })
  })
})
