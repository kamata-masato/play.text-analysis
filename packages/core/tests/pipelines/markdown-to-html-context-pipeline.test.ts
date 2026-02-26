import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Inference } from '../../inferences/inference.js'
import { MarkdownToHtmlContextPipeline } from '../../pipelines/markdown-to-html-context-pipeline.js'

let workspace: string
let destination: string

beforeEach(async () => {
  workspace = await mkdtemp(join(tmpdir(), 'glossa-context-pipeline-source-'))
  destination = await mkdtemp(join(tmpdir(), 'glossa-context-pipeline-destination-'))
})

afterEach(async () => {
  await rm(workspace, { recursive: true, force: true })
  await rm(destination, { recursive: true, force: true })
})

describe('MarkdownToHtmlContextPipeline', () => {
  describe('run - 偽陽性の除去', () => {
    it('LLM が棄却した候補が最終 HTML に含まれないこと', async () => {
      const inference: Inference = {
        infer: vi.fn().mockResolvedValue(
          JSON.stringify({
            results: [
              { name: '恒星', accepted: true, description: '自ら光を放つ天体' },
              { name: '記述', accepted: false, description: '' },
            ],
          }),
        ),
        dispose: vi.fn(),
      }
      await writeFile(
        join(workspace, 'astronomy.md'),
        '# 天文学\n\n恒星とは自ら光を放つ天体のことである。\n\n記述とは何かを文章で表現することである。',
      )
      const pipeline = new MarkdownToHtmlContextPipeline(inference)
      await pipeline.run([workspace], destination)
      const html = await readFile(join(destination, 'astronomy.html'), 'utf-8')
      const match = html.match(/window\.__GLOSSA_CONCEPTS__\s*=\s*(.+);/)
      expect(match).not.toBeNull()
      const embedded = JSON.parse(match![1]) as Record<string, unknown>
      expect(embedded).toHaveProperty('恒星')
      expect(embedded).not.toHaveProperty('記述')
    })
  })

  describe('run - フォールバックの動作', () => {
    it('推論失敗時にヒューリスティクスの結果で HTML を生成すること', async () => {
      const inference: Inference = {
        infer: vi.fn().mockRejectedValue(new Error('connection refused')),
        dispose: vi.fn(),
      }
      await writeFile(
        join(workspace, 'astronomy.md'),
        '# 天文学\n\n恒星とは自ら光を放つ天体のことである。',
      )
      const pipeline = new MarkdownToHtmlContextPipeline(inference)
      await pipeline.run([workspace], destination)
      const html = await readFile(join(destination, 'astronomy.html'), 'utf-8')
      const match = html.match(/window\.__GLOSSA_CONCEPTS__\s*=\s*(.+);/)
      expect(match).not.toBeNull()
      const embedded = JSON.parse(match![1]) as Record<string, unknown>
      expect(embedded).toHaveProperty('恒星')
    })
  })
})
