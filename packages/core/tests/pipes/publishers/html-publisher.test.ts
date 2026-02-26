import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Concept } from '../../../models/concept.js'
import type { Notebook } from '../../../models/note.js'
import { BuiltinRules } from '../../../models/rule.js'
import { HtmlPublisher } from '../../../pipes/publishers/html-publisher.js'
import { MarkdownTranscriber } from '../../../pipes/publishers/transcribers/markdown-transcriber.js'

let destination: string

beforeEach(async () => {
  destination = await mkdtemp(join(tmpdir(), 'glossa-publish-'))
})

afterEach(async () => {
  await rm(destination, { recursive: true, force: true })
})

describe('HtmlPublisher', () => {
  describe('Markdown', () => {
    describe('publish - 出力構造の生成', () => {
      it('フォルダ構造を再現してHTMLファイルを出力すること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'plants/photosynthesis.md',
            notes: [
              {
                source: 'plants/photosynthesis.md',
                text: '# 光合成',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '# 光合成',
          },
        ]
        const concepts: Concept[] = []
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'plants/photosynthesis.html'), 'utf-8')
        expect(content).toContain('<!DOCTYPE html>')
        expect(content).toContain('<title>photosynthesis</title>')
      })

      it('拡張子を.htmlに変換すること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [{ source: 'botany.md', text: '# 植物学', origins: [{ offset: 0, line: 1 }] }],
            raw: '# 植物学',
          },
        ]
        const concepts: Concept[] = []
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('<!DOCTYPE html>')
      })

      it('.cssと.jsを出力すること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [{ source: 'botany.md', text: '# 植物学', origins: [{ offset: 0, line: 1 }] }],
            raw: '# 植物学',
          },
        ]
        const concepts: Concept[] = []
        await publisher.publish(notebooks, concepts, destination)
        const stylesheet = await readFile(join(destination, 'assets/tooltip-style.css'), 'utf-8')
        expect(stylesheet).toContain('.glossa')
        expect(stylesheet).toContain('.glossa-tooltip')
        const script = await readFile(join(destination, 'assets/tooltip-script.js'), 'utf-8')
        expect(script).toContain('__GLOSSA_CONCEPTS__')
      })

      it('サブディレクトリのHTMLファイルから相対パスで.cssと.jsを参照すること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'plants/leaf.md',
            notes: [{ source: 'plants/leaf.md', text: '# 葉', origins: [{ offset: 0, line: 1 }] }],
            raw: '# 葉',
          },
        ]
        const concepts: Concept[] = []
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'plants/leaf.html'), 'utf-8')
        expect(content).toContain('href="../assets/tooltip-style.css"')
        expect(content).toContain('src="../assets/tooltip-script.js"')
      })

      it('ルートディレクトリのHTMLファイルから相対パスで.cssと.jsを参照すること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [{ source: 'botany.md', text: '# 植物学', origins: [{ offset: 0, line: 1 }] }],
            raw: '# 植物学',
          },
        ]
        const concepts: Concept[] = []
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('href="./assets/tooltip-style.css"')
        expect(content).toContain('src="./assets/tooltip-script.js"')
      })
    })

    describe('publish - 用語のマークアップ', () => {
      it('概念の用語にマッチする箇所をマークアップすること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '光合成は植物の重要な機能である',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '光合成は植物の重要な機能である',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '光合成',
            description: '光エネルギーを化学エネルギーに変換する反応',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: {
                  name: '光合成',
                  line: 1,
                  description: '光エネルギーを化学エネルギーに変換する反応',
                },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('class="glossa"')
        expect(content).toContain('data-glossa-concept="光合成"')
      })

      it('複数の同一概念の用語にマッチすること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '葉緑体で光合成が行われ、葉緑体が増える',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '葉緑体で光合成が行われ、葉緑体が増える',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '葉緑体',
            description: '光合成を行う細胞小器官',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '葉緑体', line: 1, description: '光合成を行う細胞小器官' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        const matches = content.match(/data-glossa-concept="葉緑体"/g)
        expect(matches).toHaveLength(2)
      })

      it('インラインコード内の用語にもマークアップすること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'programming.md',
            notes: [
              {
                source: 'programming.md',
                text: '`スタック`を使う',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '`スタック`を使う',
          },
        ]
        const concepts: Concept[] = [
          {
            name: 'スタック',
            description: '後入れ先出しのデータ構造',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: {
                  source: 'programming.md',
                  text: '',
                  origins: [{ offset: 0, line: 1 }],
                },
                hint: { name: 'スタック', line: 1, description: '後入れ先出しのデータ構造' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'programming.html'), 'utf-8')
        expect(content).toContain('data-glossa-concept="スタック"')
      })

      it('説明文が空の概念はマークアップしないこと', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              { source: 'botany.md', text: '維管束は水を運ぶ', origins: [{ offset: 0, line: 1 }] },
            ],
            raw: '維管束は水を運ぶ',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '維管束',
            description: '',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '維管束', line: 1 },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).not.toContain('class="glossa"')
      })
    })

    describe('publish - 最長一致優先の振る舞い', () => {
      it('重ならない位置の用語を両方マークアップすること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '被子植物は花を咲かせる植物である',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '被子植物は花を咲かせる植物である',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '被子植物',
            description: '花を持つ植物の分類群',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '被子植物', line: 1, description: '花を持つ植物の分類群' },
              },
            ],
            score: 3,
          },
          {
            name: '植物',
            description: '光合成を行う生物',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '植物', line: 1, description: '光合成を行う生物' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('data-glossa-concept="被子植物"')
        expect(content).toContain('data-glossa-concept="植物"')
      })

      it('マッチ範囲が重なる場合に短い用語をスキップすること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '被子植物が繁栄した',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '被子植物が繁栄した',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '被子植物',
            description: '花を持つ植物の分類群',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '被子植物', line: 1, description: '花を持つ植物の分類群' },
              },
            ],
            score: 3,
          },
          {
            name: '植物',
            description: '光合成を行う生物',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '植物', line: 1, description: '光合成を行う生物' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('data-glossa-concept="被子植物"')
        const short = content.match(/data-glossa-concept="植物"/g)
        expect(short).toBeNull()
      })
    })

    describe('publish - 遷移先の特定', () => {
      it('説明文を持つ証拠の行に識別子を付与すること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '光合成は重要である',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '光合成は重要である',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '光合成',
            description: '光エネルギーを化学エネルギーに変換する反応',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: {
                  name: '光合成',
                  line: 1,
                  description: '光エネルギーを化学エネルギーに変換する反応',
                },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('id="glossa-光合成-1"')
      })

      it('説明文を持たない証拠の行には識別子を付与しないこと', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '光合成は重要である',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '光合成は重要である',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '光合成',
            description: '光エネルギーを化学エネルギーに変換する反応',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'other.md', text: '', origins: [{ offset: 0, line: 5 }] },
                hint: {
                  name: '光合成',
                  line: 5,
                  description: '光エネルギーを化学エネルギーに変換する反応',
                },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('data-glossa-concept="光合成"')
        expect(content).not.toContain('id="glossa-光合成-')
      })
    })

    describe('publish - 概念データの埋め込み', () => {
      it('元のテキストに出現する概念のみを埋め込むこと', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '光合成は重要である',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '光合成は重要である',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '光合成',
            description: '光エネルギーを化学エネルギーに変換する反応',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: {
                  name: '光合成',
                  line: 1,
                  description: '光エネルギーを化学エネルギーに変換する反応',
                },
              },
            ],
            score: 3,
          },
          {
            name: '維管束',
            description: '水や養分を運ぶ組織',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 5 }] },
                hint: { name: '維管束', line: 5, description: '水や養分を運ぶ組織' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).toContain('光合成')
        expect(content).not.toContain('__GLOSSA_CONCEPTS__[' + '"維管束"')
      })

      it('元のテキストに出現しない概念は埋め込まないこと', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'physics.md',
            notes: [
              {
                source: 'physics.md',
                text: '運動エネルギーの計算',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '運動エネルギーの計算',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '位置エネルギー',
            description: '物体の位置に基づくエネルギー',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'other.md', text: '', origins: [{ offset: 0, line: 2 }] },
                hint: {
                  name: '位置エネルギー',
                  line: 2,
                  description: '物体の位置に基づくエネルギー',
                },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'physics.html'), 'utf-8')
        expect(content).not.toContain('__GLOSSA_CONCEPTS__')
      })

      it('説明文が空の概念は埋め込まないこと', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              { source: 'botany.md', text: '維管束は水を運ぶ', origins: [{ offset: 0, line: 1 }] },
            ],
            raw: '維管束は水を運ぶ',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '維管束',
            description: '',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '維管束', line: 1 },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).not.toContain('__GLOSSA_CONCEPTS__')
      })
    })

    describe('publish - 出所のリンク', () => {
      it('同一ファイル同一行番号の証拠を1件にまとめること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              {
                source: 'botany.md',
                text: '光合成は重要である',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '光合成は重要である',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '光合成',
            description: '光エネルギーを化学エネルギーに変換する反応',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: {
                  name: '光合成',
                  line: 1,
                  description: '光エネルギーを化学エネルギーに変換する反応',
                },
              },
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '光合成', line: 1, description: '植物が行う化学反応' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        const matches = content.match(/botany\.md:1/g)
        expect(matches).toHaveLength(1)
      })

      it('別ファイルの証拠から正しい相対パスのリンクを生成すること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'animals/whale.md',
            notes: [
              {
                source: 'animals/whale.md',
                text: '# 鯨',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '# 鯨\n\n回遊について',
          },
          {
            source: 'oceans/current.md',
            notes: [
              {
                source: 'oceans/current.md',
                text: '# 海流',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '# 海流\n\n回遊の経路',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '回遊',
            description: '季節に応じて生息地を移動する行動',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'animals/whale.md', text: '', origins: [{ offset: 0, line: 3 }] },
                hint: { name: '回遊', line: 3, description: '季節に応じて生息地を移動する行動' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'oceans/current.html'), 'utf-8')
        expect(content).toContain('../animals/whale.html#glossa-回遊-3')
      })

      it('出所リンクのラベルにファイル名と行番号を含めること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'chemistry.md',
            notes: [
              {
                source: 'chemistry.md',
                text: '酸化還元反応について',
                origins: [{ offset: 0, line: 1 }],
              },
            ],
            raw: '酸化還元反応について',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '酸化還元反応',
            description: '電子の授受を伴う化学反応',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'chemistry.md', text: '', origins: [{ offset: 0, line: 7 }] },
                hint: { name: '酸化還元反応', line: 7, description: '電子の授受を伴う化学反応' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'chemistry.html'), 'utf-8')
        expect(content).toContain('📄 chemistry.md:7')
      })
    })

    describe('publish - XSSの対策', () => {
      it('埋め込まれた説明文をHTMLエスケープすること', async () => {
        const publisher = new HtmlPublisher(new MarkdownTranscriber())
        const notebooks: Notebook[] = [
          {
            source: 'botany.md',
            notes: [
              { source: 'botany.md', text: '光合成について', origins: [{ offset: 0, line: 1 }] },
            ],
            raw: '光合成について',
          },
        ]
        const concepts: Concept[] = [
          {
            name: '光合成',
            description: '<script>alert("xss")</script>',
            evidences: [
              {
                rule: BuiltinRules.TohaInBody,
                note: { source: 'botany.md', text: '', origins: [{ offset: 0, line: 1 }] },
                hint: { name: '光合成', line: 1, description: '<script>alert("xss")</script>' },
              },
            ],
            score: 3,
          },
        ]
        await publisher.publish(notebooks, concepts, destination)
        const content = await readFile(join(destination, 'botany.html'), 'utf-8')
        expect(content).not.toContain('<script>alert("xss")</script>')
        expect(content).toContain('\\u003cscript>')
      })
    })
  })
})
