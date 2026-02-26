import { describe, expect, it, vi } from 'vitest'
import type { Inference } from '../../../inferences/inference.js'
import type { Prospect } from '../../../models/concept.js'
import type { Note } from '../../../models/note.js'
import { BuiltinRules } from '../../../models/rule.js'
import { ContextScorer } from '../../../pipes/scorers/context-scorer.js'

describe('ContextScorer', () => {
  describe('score - 偽陽性の除去', () => {
    it('LLM が棄却した概念を除外すること', async () => {
      const inference: Inference = {
        infer: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              name: '光合成',
              accepted: true,
              description: '植物が光エネルギーを化学エネルギーに変換する過程',
            },
            { name: '一覧', accepted: false, description: '' },
          ]),
        ),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                description: '植物が光エネルギーを化学エネルギーに変換する過程',
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
        {
          name: '一覧',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '一覧',
                line: 1,
                span: { text: '一覧', offset: 0 },
              },
            },
          ],
        },
      ]
      const scorer = new ContextScorer(inference)
      const concepts = await scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.name).toBe('光合成')
    })

    it('LLM が全て採用した場合にヒューリスティクスと同数を返すこと', async () => {
      const inference: Inference = {
        infer: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              name: '光合成',
              accepted: true,
              description: '植物が光エネルギーを化学エネルギーに変換する過程',
            },
          ]),
        ),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                description: '植物が光エネルギーを化学エネルギーに変換する過程',
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
      ]
      const scorer = new ContextScorer(inference)
      const concepts = await scorer.score(prospects)
      expect(concepts).toHaveLength(1)
    })
  })

  describe('score - 説明文の生成', () => {
    it('LLM が返した説明文で既存の空説明文を置換すること', async () => {
      const inference: Inference = {
        infer: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              name: '光合成',
              accepted: true,
              description: '植物が光を利用してエネルギーを生成する反応',
            },
          ]),
        ),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
      ]
      const scorer = new ContextScorer(inference)
      const concepts = await scorer.score(prospects)
      expect(concepts[0]?.description).toBe('植物が光を利用してエネルギーを生成する反応')
    })

    it('LLM が空の説明文を返した場合にヒューリスティクスの説明文を保持すること', async () => {
      const inference: Inference = {
        infer: vi
          .fn()
          .mockResolvedValue(JSON.stringify([{ name: '光合成', accepted: true, description: '' }])),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                description: '植物が光エネルギーを化学エネルギーに変換する過程',
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
      ]
      const scorer = new ContextScorer(inference)
      const concepts = await scorer.score(prospects)
      expect(concepts[0]?.description).toBe('植物が光エネルギーを化学エネルギーに変換する過程')
    })
  })

  describe('score - フォールバックの動作', () => {
    it('推論に失敗した場合にヒューリスティクスの結果をそのまま返すこと', async () => {
      const inference: Inference = {
        infer: vi.fn().mockRejectedValue(new Error('connection refused')),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                description: '植物が光エネルギーを化学エネルギーに変換する過程',
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
      ]
      const scorer = new ContextScorer(inference)
      const concepts = await scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.name).toBe('光合成')
      expect(concepts[0]?.description).toBe('植物が光エネルギーを化学エネルギーに変換する過程')
    })

    it('不正な JSON が返された場合にヒューリスティクスの結果をそのまま返すこと', async () => {
      const inference: Inference = {
        infer: vi.fn().mockResolvedValue('not valid json'),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                description: '植物が光エネルギーを化学エネルギーに変換する過程',
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
      ]
      const scorer = new ContextScorer(inference)
      const concepts = await scorer.score(prospects)
      expect(concepts).toHaveLength(1)
      expect(concepts[0]?.name).toBe('光合成')
    })
  })

  describe('score - 進捗通知', () => {
    it('バッチごとに進捗を通知すること', async () => {
      const inference: Inference = {
        infer: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              name: '光合成',
              accepted: true,
              description: '植物が光エネルギーを化学エネルギーに変換する過程',
            },
          ]),
        ),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                description: '植物が光エネルギーを化学エネルギーに変換する過程',
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
      ]
      const messages: string[] = []
      const monitor = (message: string) => {
        messages.push(message)
      }
      const scorer = new ContextScorer(inference)
      await scorer.score(prospects, monitor)
      expect(messages).toContain('Scoring concepts [1/1]...')
    })
  })

  describe('score - 証拠一覧の保持', () => {
    it('ヒューリスティクスが付与したスコアと証拠一覧を保持すること', async () => {
      const inference: Inference = {
        infer: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              name: '光合成',
              accepted: true,
              description: '植物が光エネルギーを化学エネルギーに変換する過程',
            },
          ]),
        ),
        dispose: vi.fn(),
      }
      const note: Note = {
        source: '植物学.md',
        text: '光合成とは植物が光エネルギーを化学エネルギーに変換する過程である',
        origins: [{ offset: 0, line: 1 }],
        headings: [{ depth: 1, text: '植物の基本', line: 1 }],
      }
      const prospects: Prospect[] = [
        {
          name: '光合成',
          evidences: [
            {
              rule: BuiltinRules.TohaInBody,
              note,
              hint: {
                name: '光合成',
                line: 1,
                description: '植物が光エネルギーを化学エネルギーに変換する過程',
                span: { text: '光合成', offset: 0 },
              },
            },
          ],
        },
      ]
      const scorer = new ContextScorer(inference)
      const concepts = await scorer.score(prospects)
      expect(concepts[0]?.score).toBe(3)
      expect(concepts[0]?.evidences).toHaveLength(1)
      expect(concepts[0]?.evidences[0]?.rule).toBe(BuiltinRules.TohaInBody)
    })
  })
})
