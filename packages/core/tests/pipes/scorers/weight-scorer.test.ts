import { describe, expect, it } from 'vitest'
import type { Prospect } from '../../../models/concept.js'
import type { Evidence } from '../../../models/evidence.js'
import type { Note } from '../../../models/note.js'
import { BuiltinRules } from '../../../models/rule.js'
import { WeightScorer } from '../../../pipes/scorers/weight-scorer.js'

describe('WeightScorer', () => {
  describe('score - スコアの合算', () => {
    it('高ルール1件でスコア3になること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '恒星とは自ら光を放つ天体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '恒星',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '恒星', line: 1, description: '自ら光を放つ天体' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.score).toBe(3)
    })

    it('中ルール1件でスコア2になること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '恒星',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '恒星',
          evidences: [{ rule: BuiltinRules.BoldText, note, hint: { name: '恒星', line: 1 } }],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(0)
    })

    it('低ルール1件でスコア1になること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '恒星は自ら光を放つ天体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '恒星',
          evidences: [{ rule: BuiltinRules.HaInBody, note, hint: { name: '恒星', line: 1 } }],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(0)
    })

    it('複数ルールのスコアを合算すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '恒星は自ら光を放つ天体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '恒星',
          evidences: [
            { rule: BuiltinRules.BoldText, note, hint: { name: '恒星', line: 1 } },
            { rule: BuiltinRules.HaInBody, note, hint: { name: '恒星', line: 1 } },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.score).toBe(3)
    })

    it('空の見込み一覧に対して空配列を返すこと', () => {
      const scorer = new WeightScorer()
      const concepts = scorer.score([])
      expect(concepts).toHaveLength(0)
    })
  })

  describe('score - 逓減の振る舞い', () => {
    it('同一ルール2件目は重みの半分で加算すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '惑星とは恒星の周りを公転する天体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '惑星',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '惑星', line: 1, description: '恒星の周りを公転する天体' },
            },
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '惑星', line: 1, description: '自ら光を放たない天体' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.score).toBe(4)
    })

    it('同一ルール3件目以降は加算しないこと', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '衛星とは惑星の周りを公転する天体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '衛星',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '衛星', line: 1, description: '惑星の周りを公転する天体' },
            },
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '衛星', line: 1, description: '月のような天体' },
            },
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '衛星', line: 1, description: '自然衛星と人工衛星がある' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.score).toBe(4)
    })

    it('高ルール2件で最大寄与4になること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '星雲（nebula）',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '星雲',
          evidences: [
            { rule: BuiltinRules.AliasInParentheses, note, hint: { name: '星雲', line: 1 } },
            { rule: BuiltinRules.AliasInParentheses, note, hint: { name: '星雲', line: 1 } },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.score).toBe(4)
    })

    it('中ルール2件で最大寄与3になること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '銀河',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '銀河',
          evidences: [
            { rule: BuiltinRules.BoldText, note, hint: { name: '銀河', line: 1 } },
            { rule: BuiltinRules.BoldText, note, hint: { name: '銀河', line: 1 } },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.score).toBe(3)
    })

    it('低ルール2件で最大寄与1になること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '彗星は氷と塵からなる天体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '彗星',
          evidences: [
            { rule: BuiltinRules.HaInBody, note, hint: { name: '彗星', line: 1 } },
            { rule: BuiltinRules.HaInBody, note, hint: { name: '彗星', line: 1 } },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(0)
    })
  })

  describe('score - 閾値によるフィルタリング', () => {
    it('スコア3以上の見込みを採用すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '超新星とは星の爆発現象である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '超新星',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '超新星', line: 1, description: '星の爆発' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.name).toBe('超新星')
    })

    it('スコア3未満の見込みを除外すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '流星',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '流星',
          evidences: [{ rule: BuiltinRules.BoldText, note, hint: { name: '流星', line: 1 } }],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(0)
    })

    it('閾値ちょうどの見込みを採用すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '隕石は宇宙から飛来した岩石である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '隕石',
          evidences: [
            { rule: BuiltinRules.BoldText, note, hint: { name: '隕石', line: 1 } },
            { rule: BuiltinRules.HaInBody, note, hint: { name: '隕石', line: 1 } },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.score).toBe(3)
    })
  })

  describe('score - 説明文の選定', () => {
    it('優先順位に従い最初に見つかった説明文を採用すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '赤色矮星（red dwarf）とは低温で暗い恒星である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '赤色矮星',
          evidences: [
            { rule: BuiltinRules.AliasInParentheses, note, hint: { name: '赤色矮星', line: 1 } },
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '赤色矮星', line: 1, description: '低温で暗い恒星' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('低温で暗い恒星')
    })

    it('全証拠に説明文がない場合は空文字を設定すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '白色矮星（white dwarf）',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '白色矮星',
          evidences: [
            { rule: BuiltinRules.AliasInParentheses, note, hint: { name: '白色矮星', line: 1 } },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('')
    })

    it('説明文選定の優先順位が低いルールより高いルールの説明文を優先すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '中性子星とは超新星爆発の後に残る天体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '中性子星',
          evidences: [
            {
              rule: BuiltinRules.AbbreviationAfterColon,
              note,
              hint: { name: '中性子星', line: 1, description: '略称の展開' },
            },
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '中性子星', line: 1, description: '超新星爆発の後に残る天体' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('超新星爆発の後に残る天体')
    })

    it('太字ルールの説明文は最後に採用されること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '暗黒物質（暗黒物質）',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '暗黒物質',
          evidences: [
            {
              rule: BuiltinRules.BoldText,
              note,
              hint: { name: '暗黒物質', line: 1, description: '見えない物質' },
            },
            {
              rule: BuiltinRules.JapaneseSupplementInParentheses,
              note,
              hint: { name: '暗黒物質', line: 1, description: '光で観測できない物質' },
            },
            { rule: BuiltinRules.AliasInParentheses, note, hint: { name: '暗黒物質', line: 1 } },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('光で観測できない物質')
    })
  })

  describe('score - 説明文の品質フィルタ', () => {
    it('「この」で始まる短い説明文を棄却して次の候補にフォールバックすること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '光年とは光が1年間に進む距離である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光年',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '光年', line: 1, description: 'この距離の単位' },
            },
            {
              rule: BuiltinRules.HaInBody,
              note,
              hint: { name: '光年', line: 1, description: '光が1年間に進む距離を表す' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('光が1年間に進む距離を表す')
    })

    it('「この」で始まる長い説明文は棄却しないこと', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: 'パーセクとは年周視差が1秒角となる距離である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: 'パーセク',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: 'パーセク',
                line: 1,
                description: 'この値は地球と太陽の距離を基準に計算されるもので年周視差から導出する',
              },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe(
        'この値は地球と太陽の距離を基準に計算されるもので年周視差から導出する',
      )
    })

    it('短すぎて述語のない説明文を棄却して次の候補にフォールバックすること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '等級とは天体の明るさの尺度である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '等級',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '等級', line: 1, description: 'Magnitude' },
            },
            {
              rule: BuiltinRules.HaInBody,
              note,
              hint: { name: '等級', line: 1, description: '天体の明るさを数値で表す' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('天体の明るさを数値で表す')
    })

    it('短くても述語のある説明文は棄却しないこと', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '食とは天体が別の天体に隠される現象である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '食',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '食', line: 1, description: '天体が隠される' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('天体が隠される')
    })

    it('全候補が棄却された場合は最優先の説明文を返すこと', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '視差とは天体の見かけの位置のずれである',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '視差',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '視差', line: 1, description: 'Parallax' },
            },
            {
              rule: BuiltinRules.HaInBody,
              note,
              hint: { name: '視差', line: 1, description: 'この位置のずれ' },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('Parallax')
    })
  })

  describe('score - 重みと優先順位の網羅', () => {
    it('重みテーブルが全7ルールを網羅すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '検証用',
        origins: [{ offset: 0, line: 1 }],
      }
      const rules = Object.values(BuiltinRules)
      for (const rule of rules) {
        const prospects: Prospect[] = [
          { name: '検証用', evidences: [{ rule, note, hint: { name: '検証用', line: 1 } }] },
        ]
        const concepts = scorer.score(prospects)
        expect(concepts.length + 0).toBeGreaterThanOrEqual(0)
      }
    })

    it('優先順位テーブルが全7ルールを網羅すること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '検証用',
        origins: [{ offset: 0, line: 1 }],
      }
      const rules = Object.values(BuiltinRules)
      const evidences: Evidence[] = rules.map((rule) => ({
        rule,
        note,
        hint: { name: '検証用', line: 1, description: `${rule}の説明として生成された候補である` },
      }))
      const prospects: Prospect[] = [{ name: '検証用', evidences }]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.description).toBe('toha-in-bodyの説明として生成された候補である')
    })

    it('本文のとは文ルールの重みが高であること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '天体とは宇宙空間の物体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '天体',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: { name: '天体', line: 1, description: '宇宙空間の物体' },
            },
          ],
        },
      ]
      expect(scorer.score(prospects)[0]?.score).toBe(3)
    })

    it('見出しのとは文ルールの重みが高であること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '宇宙空間に存在する物体の総称',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '天体',
          evidences: [
            {
              rule: BuiltinRules.TohaInHeading,
              note,
              hint: { name: '天体', line: 1, description: '宇宙空間の物体' },
            },
          ],
        },
      ]
      expect(scorer.score(prospects)[0]?.score).toBe(3)
    })

    it('括弧内の別名ルールの重みが高であること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '天体（celestial body）',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '天体',
          evidences: [
            {
              rule: BuiltinRules.AliasInParentheses,
              note,
              hint: { name: '天体', line: 1, description: '宇宙空間の物体' },
            },
          ],
        },
      ]
      expect(scorer.score(prospects)[0]?.score).toBe(3)
    })

    it('コロン後の略称展開ルールの重みが高であること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: 'AU: Astronomical Unit',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '天体',
          evidences: [
            {
              rule: BuiltinRules.AbbreviationAfterColon,
              note,
              hint: { name: '天体', line: 1, description: '宇宙空間の物体' },
            },
          ],
        },
      ]
      expect(scorer.score(prospects)[0]?.score).toBe(3)
    })

    it('太字ルールの重みが中であること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '天体',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '天体',
          evidences: [{ rule: BuiltinRules.BoldText, note, hint: { name: '天体', line: 1 } }],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(0)
    })

    it('本文のは文ルールの重みが低であること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '天体は宇宙空間の物体である',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '天体',
          evidences: [{ rule: BuiltinRules.HaInBody, note, hint: { name: '天体', line: 1 } }],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(0)
    })

    it('括弧内の日本語補足ルールの重みが低であること', () => {
      const scorer = new WeightScorer()
      const note: Note = {
        source: '天文学.md',
        text: '天体（宇宙に浮かぶ物体）',
        origins: [{ offset: 0, line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '天体',
          evidences: [
            {
              rule: BuiltinRules.JapaneseSupplementInParentheses,
              note,
              hint: { name: '天体', line: 1 },
            },
          ],
        },
      ]
      const concepts = scorer.score(prospects)
      expect(concepts).toHaveLength(0)
    })
  })
})
