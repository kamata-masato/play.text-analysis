import { describe, expect, it } from 'vitest'
import type { Evidence } from '../../../sources/models/evidence.js'
import type { Note } from '../../../sources/models/note.js'
import NameBundler from '../../../sources/processors/bundlers/name-bundler.js'

describe('NameBundler', () => {
  describe('bundle', () => {
    it('同じ name の Evidence を1つの Prospect にまとめる', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '認可', line: 1 } },
        { rule: 'toha-in-body', note, hint: { name: '認可', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('認可')
      expect(prospects[0]?.evidence).toHaveLength(2)
    })

    it('異なる name の Evidence を別の Prospect にする', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認証と認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '認証', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '認可', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(2)
      expect(prospects[0]?.name).toBe('認証')
      expect(prospects[1]?.name).toBe('認可')
    })

    it('空の Evidence 配列に対して空配列を返す', () => {
      const bundler = new NameBundler()
      expect(bundler.bundle([])).toHaveLength(0)
    })

    it('Prospect.name に最初の Evidence の hint.name を trim して設定する', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '  認可  ', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '認可', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('認可')
    })

    it('全 Evidence を Prospect.evidence に格納する', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const first: Evidence = { rule: 'bold-text', note, hint: { name: '認可', line: 1 } }
      const second: Evidence = { rule: 'toha-in-body', note, hint: { name: '認可', line: 1 } }
      const third: Evidence = { rule: 'ha-in-body', note, hint: { name: '認可', line: 1 } }
      const prospects = bundler.bundle([first, second, third])
      expect(prospects[0]?.evidence).toEqual([first, second, third])
    })
  })

  describe('正規化', () => {
    it('全角英数字と半角英数字を同じグループにする', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: 'HTTP',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'ＨＴＴＰ', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'HTTP', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('ＨＴＴＰ')
    })

    it('全角スペースと半角スペースを同じグループにする', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: 'shared memory',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'shared\u3000memory', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'shared memory', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
    })

    it('大文字と小文字を同じグループにする', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: 'HTTP',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'HTTP', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'http', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('HTTP')
    })

    it('複数の正規化ルールを同時に適用する', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: 'shared memory',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'Ｓｈａｒｅｄ　Ｍｅｍｏｒｙ', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'shared memory', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
    })

    it('全角数字と半角数字を同じグループにする', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: 'UTF8',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'ＵＴＦ８', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'UTF8', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('先頭助詞の除去', () => {
    it('先頭の「と」を除去してグルーピングする', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'と認可', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '認可', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('認可')
      expect(prospects[0]?.evidence).toHaveLength(2)
    })

    it('先頭の「や」を除去してグルーピングする', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'や認可', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '認可', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('認可')
    })

    it('助詞1文字だけの name は除去しない', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: 'と',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [{ rule: 'bold-text', note, hint: { name: 'と', line: 1 } }]
      const prospects = bundler.bundle(evidence)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('と')
    })

    it('先頭の助詞を除去した結果を Prospect.name に反映する', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'と認可', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects[0]?.name).toBe('認可')
    })

    it('2文字目以降の助詞は除去しない', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'test.md',
        text: '認証と認可',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidence: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '認証と認可', line: 1 } },
      ]
      const prospects = bundler.bundle(evidence)
      expect(prospects[0]?.name).toBe('認証と認可')
    })
  })
})
