import { describe, expect, it } from 'vitest'
import type { Note } from '../../../models/note.js'
import { HaInBodyFinder } from '../../../pipes/finders/ha-in-body-finder.js'

describe('HaInBodyFinder', () => {
  describe('find - 文末パターンの検出', () => {
    it('「Xは〜です」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: '扇状地は、山地から平地に出る地点に堆積物が広がった地形です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('扇状地')
      expect(hints[0]?.description).toBe('山地から平地に出る地点に堆積物が広がった地形です')
    })

    it('「Xは〜である」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'カルデラは火山の噴火で形成された大きな凹地である',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カルデラ')
      expect(hints[0]?.description).toBe('火山の噴火で形成された大きな凹地である')
    })

    it('「Xは〜のこと」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'リアス式は入り江が連続する海岸のこと',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('リアス式')
      expect(hints[0]?.description).toBe('入り江が連続する海岸のこと')
    })

    it('「Xは〜を指す」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'モレーンは氷河が運んだ堆積物を指す',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('モレーン')
      expect(hints[0]?.description).toBe('氷河が運んだ堆積物を指す')
    })

    it('複数の「は」パターンを検出すること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'リアス式は入り江が連続する海岸です。モレーンは氷河が運んだ堆積物です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('リアス式')
      expect(hints[1]?.name).toBe('モレーン')
    })

    it('読点で用語を区切ること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: '重要な概念として、扇状地は山地から平地へ広がる地形です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.name).toBe('扇状地')
    })
  })

  describe('find - 文末表現の網羅性', () => {
    it('「Xは〜のことである」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'カルデラは火山の噴火で形成された大きな凹地のことである',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('のことである')
    })

    it('「Xは〜のことです」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'カルデラは火山の噴火で形成された大きな凹地のことです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('のことです')
    })

    it('「Xは〜を意味します」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: '浸食性は水や風が地表を削り取る性質を意味します',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を意味します')
    })

    it('「Xは〜を意味する」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: '浸食性は水や風が地表を削り取る性質を意味する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を意味する')
    })

    it('「Xは〜を指します」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'モレーンは氷河が運んだ堆積物を指します',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('を指します')
    })

    it('「Xは〜の略称です」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'GPSはGlobal Positioning Systemの略称です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略称です')
    })

    it('「Xは〜の略称」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'GPSはGlobal Positioning Systemの略称',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略称')
    })

    it('「Xは〜の略です」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'GPSはGlobal Positioning Systemの略です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略です')
    })

    it('「Xは〜の略」の形式にマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'GPSはGlobal Positioning Systemの略',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.description).toContain('の略')
    })
  })

  describe('find - 全般の振る舞い', () => {
    it('文末表現にマッチしない「は」の文にはマッチしないこと', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'これは問題がある',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('テキストが空の場合は空配列を返すこと', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('マッチ位置を正しく設定すること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'カルデラは火山の噴火で形成された凹地です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('カルデラ')
    })

    it('ソースファイルの行番号を正しく設定すること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'カルデラは火山の噴火で形成された凹地です',
        origins: [{ offset: 0, line: 7 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.line).toBe(7)
    })

    it('行番号対応一覧で後半パターンの行番号を正しく解決すること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: '前半のテキスト。カルデラは火山の噴火で形成された凹地です',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 15 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('カルデラ')
      expect(hints[0]?.line).toBe(15)
    })

    it('「とは」を含む文にもマッチすること', () => {
      const finder = new HaInBodyFinder()
      const note: Note = {
        source: '地形学.md',
        text: 'フィヨルドの地形とは氷河が削った谷です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('フィヨルドの地形と')
    })
  })
})
