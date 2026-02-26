import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MarkdownToHtmlPipeline } from '../../pipelines/markdown-to-html-pipeline.js'

let workspace: string
let destination: string

beforeEach(async () => {
  workspace = await mkdtemp(join(tmpdir(), 'glossa-pipeline-source-'))
  destination = await mkdtemp(join(tmpdir(), 'glossa-pipeline-destination-'))
})

afterEach(async () => {
  await rm(workspace, { recursive: true, force: true })
  await rm(destination, { recursive: true, force: true })
})

describe('MarkdownToHtmlPipeline', () => {
  describe('run - パイプライン全体の実行', () => {
    it('Markdownファイルから用語付きHTMLを生成すること', async () => {
      const pipeline = new MarkdownToHtmlPipeline()
      await writeFile(
        join(workspace, 'ceramics.md'),
        '# 陶芸\n\n釉薬とは陶器の表面を覆うガラス質の被膜である。',
      )
      await pipeline.run([workspace], destination)
      const html = await readFile(join(destination, 'ceramics.html'), 'utf-8')
      expect(html).toContain('釉薬')
      expect(html).toContain('glossa')
    })

    it('サブディレクトリのMarkdownファイルも探索すること', async () => {
      const pipeline = new MarkdownToHtmlPipeline()
      await mkdir(join(workspace, 'techniques'), { recursive: true })
      await writeFile(
        join(workspace, 'techniques', 'glazing.md'),
        '# 施釉\n\n**釉薬**は陶器の表面を覆う。**釉薬**の成分は多様である。',
      )
      await pipeline.run([workspace], destination)
      expect(existsSync(join(destination, 'techniques', 'glazing.html'))).toBe(true)
    })

    it('.markdown拡張子のファイルも対象にすること', async () => {
      const pipeline = new MarkdownToHtmlPipeline()
      await writeFile(
        join(workspace, 'kiln.markdown'),
        '# 窯\n\n**窯変**は焼成中に起こる変化である。**窯変**の美しさは偶然に左右される。',
      )
      await pipeline.run([workspace], destination)
      expect(existsSync(join(destination, 'kiln.html'))).toBe(true)
    })

    it('複数のソースディレクトリを処理すること', async () => {
      const pipeline = new MarkdownToHtmlPipeline()
      const second = await mkdtemp(join(tmpdir(), 'glossa-pipeline-source-second-'))
      try {
        await writeFile(
          join(workspace, 'clay.md'),
          '# 粘土\n\n**陶土**は粘土の一種である。**陶土**の産地は限られる。',
        )
        await writeFile(
          join(second, 'glaze.md'),
          '# 釉薬\n\n**灰釉**は植物灰を原料とする。**灰釉**の色合いは独特である。',
        )
        await pipeline.run([workspace, second], destination)
        expect(existsSync(join(destination, 'clay.html'))).toBe(true)
        expect(existsSync(join(destination, 'glaze.html'))).toBe(true)
      } finally {
        await rm(second, { recursive: true, force: true })
      }
    })

    it('Markdownファイルが無い場合でもエラーにならないこと', async () => {
      const pipeline = new MarkdownToHtmlPipeline()
      await writeFile(join(workspace, 'notes.txt'), 'テキストファイル')
      await expect(pipeline.run([workspace], destination)).resolves.not.toThrow()
    })
  })

  describe('run - ファイルの探索', () => {
    it('対象拡張子のファイルのみ返すこと', async () => {
      const pipeline = new MarkdownToHtmlPipeline()
      await writeFile(
        join(workspace, 'pottery.md'),
        '# 陶器\n\n**素焼き**は最初の焼成工程である。**素焼き**の温度は低い。',
      )
      await writeFile(join(workspace, 'notes.txt'), 'メモ')
      await writeFile(join(workspace, 'data.json'), '{}')
      await pipeline.run([workspace], destination)
      expect(existsSync(join(destination, 'pottery.html'))).toBe(true)
      expect(existsSync(join(destination, 'notes.html'))).toBe(false)
      expect(existsSync(join(destination, 'data.html'))).toBe(false)
    })
  })
})
