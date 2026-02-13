import { describe, expect, it } from 'vitest'
import type { Evidence } from '../../../models/evidence.js'
import type { Note } from '../../../models/note.js'
import { NameBundler } from '../../../pipes/bundlers/name-bundler.js'

describe('NameBundler', () => {
  describe('bundle - 証拠一覧の仕分け', () => {
    it('同じ用語の証拠を1つの見込みにまとめること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const first: Evidence = { rule: 'bold-text', note, hint: { name: '母音', line: 1 } }
      const second: Evidence = { rule: 'toha-in-body', note, hint: { name: '母音', line: 1 } }
      const third: Evidence = { rule: 'ha-in-body', note, hint: { name: '母音', line: 1 } }
      const prospects = bundler.bundle([first, second, third])
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('母音')
      expect(prospects[0]?.evidences).toEqual([first, second, third])
    })

    it('異なる用語の証拠を別の見込みにすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '子音と母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '子音', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(2)
      expect(prospects[0]?.name).toBe('子音')
      expect(prospects[1]?.name).toBe('母音')
    })

    it('空の証拠一覧に対して空配列を返すこと', () => {
      const bundler = new NameBundler()
      expect(bundler.bundle([])).toHaveLength(0)
    })

    it('見込みの用語に最初の証拠の用語を空白除去して設定すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '  母音  ', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('母音')
    })
  })

  describe('bundle - 用語の正規化', () => {
    it('全角英数字と半角英数字を同じ仕分けにすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'WORT',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'ＷＯＲＴ１', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'WORT1', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('ＷＯＲＴ１')
    })

    it('全角スペースと半角スペースを同じ仕分けにすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'forte piano',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'forte　piano', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'forte piano', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('forte　piano')
    })

    it('大文字と小文字を同じ仕分けにすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'WORT',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'WORT', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'wort', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('WORT')
    })

    it('複数の正規化ルールを同時に適用すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'forte piano',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'Ｆｏｒｔｅ　Ｐｉａｎｏ', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'forte piano', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('Ｆｏｒｔｅ　Ｐｉａｎｏ')
    })
  })

  describe('bundle - 先頭助詞の除去', () => {
    it('先頭の「と」を除去して仕分けすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'と母音', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('母音')
      expect(prospects[0]?.evidences).toHaveLength(2)
    })

    it('先頭の「や」を除去して仕分けすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'や母音', line: 1 } },
        { rule: 'bold-text', note, hint: { name: '母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('母音')
    })

    it('助詞1文字だけの用語は除去しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'と',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: 'と', line: 1 } }]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('と')
    })

    it('先頭の助詞を除去した結果を見込みの用語に反映すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'と母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects[0]?.name).toBe('母音')
    })

    it('先頭の助詞と用語の間の空白を除去すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'WORT',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'や WORT', line: 1 } },
        { rule: 'bold-text', note, hint: { name: 'WORT', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('WORT')
    })

    it('2文字目以降の助詞は除去しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '子音と母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '子音と母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects[0]?.name).toBe('子音と母音')
    })
  })

  describe('bundle - 助詞による棄却', () => {
    it('助詞を2個以上含む用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '音素の分類に基づく体系',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: '音素の分類に基づく体系', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(0)
    })

    it('助詞を1個だけ含む用語は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '音素の体系',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '音素の体系', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('音素の体系')
    })

    it('助詞を含まない用語は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: '母音', line: 1 } }]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('bundle - 先頭助詞の棄却', () => {
    it('先頭が「の」の用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'の回数が',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'の回数が', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('先頭が「に」の用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'に分ける',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'に分ける', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('先頭が「が」の用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'が重要',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'が重要', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('先頭が「で」の用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'で処理',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'で処理', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('先頭が「は」の用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'は重要',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'alias-in-parentheses', note, hint: { name: 'は重要', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - 括弧部分の正規化による統合', () => {
    it('括弧付きの用語と括弧なしの用語を同じ仕分けにすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音（Vowel）と母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '母音（Vowel）', line: 1 } },
        { rule: 'alias-in-parentheses', note, hint: { name: '母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.evidences).toHaveLength(2)
    })

    it('半角括弧は除去せず別の仕分けにすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音(Vowel)と母音',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '母音(Vowel)', line: 1 } },
        { rule: 'alias-in-parentheses', note, hint: { name: '母音', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(2)
    })

    it('全角括弧を除去した表示名を見込みの用語に設定すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '母音（Vowel）',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '母音（Vowel）', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('母音')
    })
  })

  describe('bundle - 指示詞始まりの棄却', () => {
    it('「これ」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'これが音素',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'これが音素', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「ここ」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'ここで重要',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'ここで重要', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「この」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'この体系',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'この体系', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「その」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'その変化',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'その変化', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「それ」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'それが特徴',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'それが特徴', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「あの」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'あの法則',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'あの法則', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「あれ」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'あれが音韻',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'あれが音韻', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「そして」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'そして変化',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'そして変化', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「まず」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'まず基礎',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'まず基礎', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「どう」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'どう変わる',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'どう変わる', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「なぜ」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'なぜ重要',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'なぜ重要', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「または」で始まる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'または変異',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: 'または変異', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - 番号プレフィックスの正規化', () => {
    it('番号付きリストのプレフィックスを除去した用語を見込みに設定すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '1. 音素',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '1. 音素', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('音素')
    })

    it('番号プレフィックス付きと番号なしの用語を同じ仕分けにすること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '3. 音素と音素',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '3. 音素', line: 1 } },
        { rule: 'toha-in-body', note, hint: { name: '音素', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.evidences).toHaveLength(2)
    })

    it('番号の後にピリオドとスペースがない場合は除去しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '3音素',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: '3音素', line: 1 } }]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
      expect(prospects[0]?.name).toBe('3音素')
    })
  })

  describe('bundle - 不完全引用符の棄却', () => {
    it('開き括弧「のみで閉じ括弧」がない用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '「あるべき体系',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '「あるべき体系', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('開き括弧と閉じ括弧の両方がある用語は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '「音素」',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '「音素」', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })

    it('引用符を含まない用語は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '音素',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: '音素', line: 1 } }]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('bundle - 不完全な「こと」の棄却', () => {
    it('「こ」で終わる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '逆算するこ',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '逆算するこ', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「こと」で終わる用語は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '変化すること',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '変化すること', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('bundle - 述語終わりの棄却の拡張', () => {
    it('「を実行」で終わる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '分析を実行',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '分析を実行', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - 使役形終わりの棄却', () => {
    it('「させ」で終わる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '加算的に増加させ',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '加算的に増加させ', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - 箇条書き記号始まりの棄却', () => {
    it('「・」で始まる手がかりを棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '・音調',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '・音調', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「→」で始まる手がかりを棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '→音調',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'ha-in-body', note, hint: { name: '→音調', line: 1 } }]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('「→ 」（空白付き）で始まる手がかりも棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '→ 声調',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '→ 声調', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('箇条書き記号を含むが先頭でない手がかりは棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '音調・声調',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '音調・声調', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('bundle - 年号のみの棄却', () => {
    it('数字と年のみの手がかりを棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '1986 年',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '1986 年', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('数字と年の間に空白がない場合も棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '2002年',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '2002年', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('年を含むが他の文字もある手がかりは棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '2002 年問題',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '2002 年問題', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })

    it('年で始まるが年で終わらない手がかりは棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: '元年制度',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: '元年制度', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('bundle - カンマを含む用語の棄却', () => {
    it('半角カンマを含む用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '構文論.md',
        text: 'アプリケーション層, ドメイン層 など',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        {
          rule: 'ha-in-body',
          note,
          hint: { name: 'アプリケーション層, ドメイン層 など', line: 1 },
        },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - コロン区切りの棄却', () => {
    it('コロンと空白を含む用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '計算量.md',
        text: 'インデックスあり: O',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        {
          rule: 'alias-in-parentheses',
          note,
          hint: { name: 'インデックスあり: O', line: 1 },
        },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - ひらがな「い」終わりの棄却', () => {
    it('ひらがな「い」で終わる用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'キャッシュ.md',
        text: '古い',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: '古い', line: 1 } }]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('カタカナ「イ」で終わる用語は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'キャッシュ.md',
        text: 'ディスプレイ',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'bold-text', note, hint: { name: 'ディスプレイ', line: 1 } },
      ]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('bundle - 単一英字の棄却', () => {
    it('単一の英大文字のみの用語を棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'H',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: 'H', line: 1 } }]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })

    it('2文字以上の英字は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'IP',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: 'IP', line: 1 } }]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })

    it('単一の英小文字は棄却しないこと', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '音韻論.md',
        text: 'a',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [{ rule: 'bold-text', note, hint: { name: 'a', line: 1 } }]
      const prospects = bundler.bundle(evidences)
      expect(prospects).toHaveLength(1)
    })
  })

  describe('bundle - 数式記号の棄却', () => {
    it('「$$」を含む手がかりを棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: '機械学習.md',
        text: '$$TP$$：予測結果',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '$$TP$$：予測結果', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - @始まりの棄却', () => {
    it('「@」で始まる手がかりを棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'プログラミング.md',
        text: '@事実 グローバルスコープ',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'toha-in-body', note, hint: { name: '@事実 グローバルスコープ', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })

  describe('bundle - 波括弧を含む用語の棄却', () => {
    it('波括弧を含む手がかりを棄却すること', () => {
      const bundler = new NameBundler()
      const note: Note = {
        source: 'ウェブ標準.md',
        text: '}} プロパティは {{domxref',
        origins: [{ offset: 0, line: 1 }],
      }
      const evidences: Evidence[] = [
        { rule: 'ha-in-body', note, hint: { name: '}} プロパティは {{domxref', line: 1 } },
      ]
      expect(bundler.bundle(evidences)).toHaveLength(0)
    })
  })
})
