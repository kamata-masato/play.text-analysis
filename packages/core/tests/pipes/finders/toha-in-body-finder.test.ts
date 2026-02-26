import { describe, expect, it } from 'vitest'
import type { Note } from '../../../models/note.js'
import { TohaInBodyFinder } from '../../../pipes/finders/toha-in-body-finder.js'

describe('TohaInBodyFinder', () => {
  describe('find - 文末パターンの検出', () => {
    it('「Xとは〜です」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'シンコペーションとは弱拍にアクセントを置くリズム技法です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('シンコペーション')
      expect(hints[0]?.description).toBe('弱拍にアクセントを置くリズム技法です')
    })

    it('「Xとは〜である」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'アルペジオ奏法とは和音を一音ずつ分散して弾く技法である',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('アルペジオ奏法')
      expect(hints[0]?.description).toBe('和音を一音ずつ分散して弾く技法である')
    })

    it('「Xとは〜のこと」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'カデンツァとは独奏者が技巧を披露する即興部分のこと',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カデンツァ')
      expect(hints[0]?.description).toBe('独奏者が技巧を披露する即興部分のこと')
    })

    it('「Xとは〜を指す」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '通奏低音とは低声部の伴奏旋律を指す',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('通奏低音')
      expect(hints[0]?.description).toBe('低声部の伴奏旋律を指す')
    })

    it('「Xとは〜を意味する」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '即興性とは楽譜にない旋律を即座に創作することを意味する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('即興性')
      expect(hints[0]?.description).toBe('楽譜にない旋律を即座に創作することを意味する')
    })

    it('「Xとは〜の略」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'BPMとはBeats Per Minuteの略',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('BPM')
      expect(hints[0]?.description).toBe('Beats Per Minuteの略')
    })
  })

  describe('find - 読点パターンの検出', () => {
    it('「Xとは、Y。」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'カデンツァとは、楽曲の終止部分で独奏者が技巧を自由に披露する部分。次の文。',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カデンツァ')
      expect(hints[0]?.description).toBe('楽曲の終止部分で独奏者が技巧を自由に披露する部分')
    })

    it('「Xとは、Y」がテキスト末尾で終わる場合にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'カデンツァとは、独奏者が技巧を披露する即興演奏',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カデンツァ')
      expect(hints[0]?.description).toBe('独奏者が技巧を披露する即興演奏')
    })
  })

  describe('find - パターンの優先制御', () => {
    it('文末パターンと読点パターンが重複する場合は文末パターンを優先すること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'シンコペーションとは、弱拍にアクセントを置くリズム技法です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('シンコペーション')
      expect(hints[0]?.description).toBe('弱拍にアクセントを置くリズム技法です')
    })
  })

  describe('find - 用語の左端区切り', () => {
    it('読点で用語を区切ること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '楽曲の終止部分において、カデンツァとは何かを理解することです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カデンツァ')
    })

    it('句点で用語を区切ること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '前の文。カデンツァとは即興の演奏です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カデンツァ')
    })

    it('改行で用語を区切ること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '前の文\nカデンツァとは即興の演奏です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カデンツァ')
    })
  })

  describe('find - 文末表現の網羅性', () => {
    it('「Xとは〜のことである」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'ポリフォニーとは複数の独立した旋律が同時に進行する形式のことである',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('のことである')
    })

    it('「Xとは〜のことです」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'ポリフォニーとは複数の独立した旋律が同時に進行する形式のことです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('のことです')
    })

    it('「Xとは〜を意味します」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '即興性とは楽譜にない旋律を即座に創作することを意味します',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を意味します')
    })

    it('「Xとは〜を指します」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '通奏低音とは低声部の伴奏旋律を指します',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を指します')
    })

    it('「Xとは〜の略称です」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'BPMとはBeats Per Minuteの略称です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略称です')
    })

    it('「Xとは〜の略称」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'BPMとはBeats Per Minuteの略称',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略称')
    })

    it('「Xとは〜の略です」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'BPMとはBeats Per Minuteの略です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略です')
    })

    it('「Xとは〜です」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'フーガとは主題を模倣しながら展開する楽曲形式です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('です')
    })

    it('「Xとは〜である」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'ソナタとは複数の楽章で構成される器楽曲である',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('である')
    })

    it('「Xとは〜のこと」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'セレナーデとは夕べに演奏される楽曲のこと',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('のこと')
    })

    it('「Xとは〜を意味する」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'レガートとは音を滑らかにつなげることを意味する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を意味する')
    })

    it('「Xとは〜を指す」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'コーダとは楽曲の終結部分を指す',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を指す')
    })

    it('「Xとは〜の略」の形式にマッチすること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'DAWとはDigital Audio Workstationの略',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略')
    })
  })

  describe('find - 全般の振る舞い', () => {
    it('「とはいえ」にはマッチしないこと', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: 'そうとはいえ問題は残る',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('複数の「とは」パターンを検出すること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '通奏低音とは低声部の伴奏旋律です。対位旋律とは主旋律に対する副旋律です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('通奏低音')
      expect(hints[1]?.name).toBe('対位旋律')
    })

    it('テキストが空の場合は空配列を返すこと', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('マッチ位置を正しく設定すること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '通奏低音とは低声部の伴奏旋律です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('通奏低音')
      expect(hints[0]?.span?.text).toContain('です')
    })

    it('ソースファイルの行番号を正しく設定すること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '通奏低音とは低声部の伴奏旋律です',
        origins: [{ offset: 0, line: 5 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.line).toBe(5)
    })

    it('行番号対応一覧で後半パターンの行番号を正しく解決すること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '前半のテキスト。対位旋律とは主旋律に対する副旋律です',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 10 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('対位旋律')
      expect(hints[0]?.line).toBe(10)
    })

    it('「とは」の直後に改行がある場合は説明文を省略すること', () => {
      const finder = new TohaInBodyFinder()
      const note: Note = {
        source: '音楽理論.md',
        text: '通奏低音とは\n次の行の内容',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })
  })
})
