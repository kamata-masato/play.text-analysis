import { describe, expect, it } from 'vitest'
import MarkdownParser from '../../../sources/processors/parsers/markdown-parser.js'

describe('MarkdownParser', () => {
  describe('parse - 空ファイル', () => {
    it('空文字列で notes が空の Notebook を返す', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('empty.md', '')
      expect(notebook.notes).toHaveLength(0)
      expect(notebook.source).toBe('empty.md')
      expect(notebook.raw).toBe('')
    })

    it('空白のみで notes が空の Notebook を返す', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '   \n\n  ')
      expect(notebook.notes).toHaveLength(0)
    })
  })

  describe('parse - raw 保持', () => {
    it('入力文字列をそのまま raw に格納する', () => {
      const parser = new MarkdownParser()
      const content = `# はじめに

ここは導入文です。

## 基本概念

**コアダンプ**とは、プロセスが異常終了したときにメモリの内容を記録したもの。

### 詳細

シグナルハンドラとは、特定のシグナルを受け取ったときに実行される関数。
`
      const notebook = parser.parse('nested-headings.md', content)
      expect(notebook.raw).toBe(content)
    })
  })

  describe('parse - ノート分割', () => {
    it('見出しで区切ってノートを分割する', () => {
      const parser = new MarkdownParser()
      const content = `# はじめに

ここは導入文です。

## 基本概念

**コアダンプ**とは、プロセスが異常終了したときにメモリの内容を記録したもの。

### 詳細

シグナルハンドラとは、特定のシグナルを受け取ったときに実行される関数。
`
      const notebook = parser.parse('nested-headings.md', content)
      expect(notebook.notes).toHaveLength(3)
    })

    it('冒頭ノートは headings が undefined になる', () => {
      const parser = new MarkdownParser()
      const content = `見出しがない冒頭のノート。

# 最初の見出し

見出し後のノート。
`
      const notebook = parser.parse('front-matter-note.md', content)
      expect(notebook.notes).toHaveLength(2)
      expect(notebook.notes[0]?.headings).toBeUndefined()
    })

    it('見出しのみのファイルは text が空の Note を生成する', () => {
      const parser = new MarkdownParser()
      const content = `# タイトルのみ

## サブタイトル
`
      const notebook = parser.parse('headings-only.md', content)
      expect(notebook.notes.length).toBeGreaterThanOrEqual(1)
      for (const note of notebook.notes) {
        expect(note.text).toBe('')
      }
    })
  })

  describe('parse - 祖先見出し', () => {
    it('見出しスタックを浅い順に設定する', () => {
      const parser = new MarkdownParser()
      const content = `# はじめに

ここは導入文です。

## 基本概念

**コアダンプ**とは、プロセスが異常終了したときにメモリの内容を記録したもの。

### 詳細

シグナルハンドラとは、特定のシグナルを受け取ったときに実行される関数。
`
      const notebook = parser.parse('nested-headings.md', content)

      expect(notebook.notes[0]?.headings).toHaveLength(1)
      expect(notebook.notes[0]?.headings?.[0]?.depth).toBe(1)
      expect(notebook.notes[0]?.headings?.[0]?.text).toBe('はじめに')

      expect(notebook.notes[1]?.headings).toHaveLength(2)
      expect(notebook.notes[1]?.headings?.[0]?.depth).toBe(1)
      expect(notebook.notes[1]?.headings?.[1]?.depth).toBe(2)
      expect(notebook.notes[1]?.headings?.[1]?.text).toBe('基本概念')

      expect(notebook.notes[2]?.headings).toHaveLength(3)
      expect(notebook.notes[2]?.headings?.[2]?.depth).toBe(3)
      expect(notebook.notes[2]?.headings?.[2]?.text).toBe('詳細')
    })

    it('見出しの depth が低下するとスタックをリセットする', () => {
      const parser = new MarkdownParser()
      const content = '# A\n\ntext a\n\n## B\n\ntext b\n\n# C\n\ntext c'
      const notebook = parser.parse('inline.md', content)

      expect(notebook.notes[2]?.headings).toHaveLength(1)
      expect(notebook.notes[2]?.headings?.[0]?.text).toBe('C')
    })

    it('見出しの depth が飛ぶ場合はそのまま反映する', () => {
      const parser = new MarkdownParser()
      const content = '# A\n\ntext\n\n### C\n\ntext'
      const notebook = parser.parse('inline.md', content)

      expect(notebook.notes[1]?.headings).toHaveLength(2)
      expect(notebook.notes[1]?.headings?.[0]?.depth).toBe(1)
      expect(notebook.notes[1]?.headings?.[1]?.depth).toBe(3)
    })
  })

  describe('parse - text 抽出', () => {
    it('Markdown 記法を除去してプレーンテキストを抽出する', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# Heading\n\n**bold** normal')
      const note = notebook.notes[0]
      expect(note?.text).toContain('bold')
      expect(note?.text).toContain('normal')
      expect(note?.text).not.toContain('**')
    })

    it('コードブロックの内容を除外する', () => {
      const parser = new MarkdownParser()
      const content = `# コードブロック

\`\`\`typescript
const value = 42
\`\`\`

段落テキスト。
`
      const notebook = parser.parse('code-blocks.md', content)
      const note = notebook.notes[0]
      expect(note?.text).not.toContain('const value')
      expect(note?.text).toContain('段落テキスト')
    })

    it('インラインコードの内容を含める', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\nUse `npm install` to install.')
      const note = notebook.notes[0]
      expect(note?.text).toContain('npm install')
    })

    it('リストをフラット化して含める', () => {
      const parser = new MarkdownParser()
      const content = `# リスト

- アイテム1
- アイテム2
  - ネストされたアイテム
- アイテム3
`
      const notebook = parser.parse('list.md', content)
      const note = notebook.notes[0]
      expect(note?.text).toContain('アイテム1')
      expect(note?.text).toContain('ネストされたアイテム')
      expect(note?.text).toContain('アイテム3')
    })

    it('テーブルのセル内容を含める', () => {
      const parser = new MarkdownParser()
      const content = `# テーブルテスト

| 用語 | 説明 |
|---|---|
| カーネル | OSの中核部分 |
| プロセス | 実行中のプログラム |
`
      const notebook = parser.parse('table.md', content)
      const note = notebook.notes[0]
      expect(note?.text).toContain('カーネル')
      expect(note?.text).toContain('OSの中核部分')
      expect(note?.text).toContain('プロセス')
      expect(note?.text).toContain('実行中のプログラム')
    })

    it('見出しテキストを note.text に含めない', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# 見出し\n\n段落テキスト')
      const note = notebook.notes[0]
      expect(note?.text).not.toContain('見出し')
      expect(note?.text).toContain('段落テキスト')
    })

    it('リンクの表示テキストを含め URL を捨てる', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\n[表示テキスト](https://example.com)')
      const note = notebook.notes[0]
      expect(note?.text).toContain('表示テキスト')
      expect(note?.text).not.toContain('https://example.com')
    })

    it('画像の alt テキストを含める', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\n![代替テキスト](image.png)')
      const note = notebook.notes[0]
      expect(note?.text).toContain('代替テキスト')
    })

    it('ブロック要素間を改行で区切る', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\n段落1\n\n段落2')
      const note = notebook.notes[0]
      expect(note?.text).toBe('段落1\n段落2')
    })
  })

  describe('parse - emphases', () => {
    it('strong の Emphasis を正しい offset で記録する', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\n**コアダンプ**とは、プロセスが...')
      const note = notebook.notes[0]
      expect(note?.emphases).toHaveLength(1)
      expect(note?.emphases?.[0]?.span.text).toBe('コアダンプ')
      expect(note?.emphases?.[0]?.span.offset).toBe(0)
      expect(note?.emphases?.[0]?.kind).toBe('strong')
    })

    it('先頭以外の位置にある strong の offset が正しい', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\nPrefix **target** suffix')
      const note = notebook.notes[0]
      expect(note?.emphases?.[0]?.span.text).toBe('target')
      expect(note?.emphases?.[0]?.span.offset).toBe('Prefix '.length)
    })

    it('ネストした strong は外側のみ Emphasis として記録する', () => {
      const parser = new MarkdownParser()
      const content = '**外側 **内側** テキスト**\n'
      const notebook = parser.parse('nested-strong.md', content)
      /**
       * 冒頭ノートは heading を持たず、1つの Emphasis を含む
       */
      const emphasized = notebook.notes.filter((note) => note.emphases !== undefined)
      expect(emphasized).toHaveLength(1)
      expect(emphasized[0]?.emphases).toHaveLength(1)
    })

    it('strong がない場合は emphases が undefined になる', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\nPlain text only.')
      const note = notebook.notes[0]
      expect(note?.emphases).toBeUndefined()
    })
  })

  describe('parse - origins', () => {
    it('テキストのソース行番号を記録する', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\nLine 3 text')
      const note = notebook.notes[0]
      expect(note?.origins).toHaveLength(1)
      expect(note?.origins[0]?.offset).toBe(0)
      expect(note?.origins[0]?.line).toBe(3)
    })

    it('同一行の連続テキストで Origin を重複させない', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\n**bold** rest')
      const note = notebook.notes[0]
      expect(note?.origins).toHaveLength(1)
    })

    it('複数行にまたがるテキストで複数の Origin を記録する', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('inline.md', '# H\n\n段落1\n\n段落2')
      const note = notebook.notes[0]
      expect(note?.origins.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('parse - source 伝播', () => {
    it('全 Note に source を設定する', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('/absolute/path/to/doc.md', '# H\n\nText')
      for (const note of notebook.notes) {
        expect(note.source).toBe('/absolute/path/to/doc.md')
      }
    })
  })
})
