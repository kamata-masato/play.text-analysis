import { describe, expect, it } from 'vitest'
import { MarkdownParser } from '../../../pipes/parsers/markdown-parser.js'

describe('MarkdownParser', () => {
  describe('extensions - 対象拡張子の一覧', () => {
    it('.md と .markdown を返すこと', () => {
      const parser = new MarkdownParser()
      expect(parser.extensions()).toEqual(['.md', '.markdown'])
    })
  })

  describe('parse - 空の入力', () => {
    it('空文字列でノート一覧が空の結果を返すこと', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('建築構造.md', '')
      expect(notebook.notes).toHaveLength(0)
      expect(notebook.source).toBe('建築構造.md')
      expect(notebook.raw).toBe('')
    })

    it('空白のみでノート一覧が空の結果を返すこと', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse('建築構造.md', '   \n\n  ')
      expect(notebook.notes).toHaveLength(0)
    })
  })

  describe('parse - 元テキストの保持', () => {
    it('入力文字列をそのまま元テキストに格納すること', () => {
      const parser = new MarkdownParser()
      const content = `
# 石造建築

石材を積み上げて構築する歴史的な工法。
`
      const notebook = parser.parse('建築構造.md', content)
      expect(notebook.raw).toBe(content)
    })
  })

  describe('parse - ノートの分割', () => {
    it('見出しで区切ってノートを分割すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 防火区画

建築物の延焼を防ぐために区画を設ける。

## 耐火被覆

鉄骨に耐火材を巻いて火災時の座屈を防止する。

### 防煙壁

煙の拡散を抑える垂れ壁を天井面に設置する。
`,
      )
      expect(notebook.notes).toHaveLength(3)
    })

    it('冒頭ノートは見出し一覧を持たないこと', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
敷地外構の計画では動線と植栽の配置を検討する。

# 植栽計画

樹種の選定と配置間隔を決定する。
`,
      )
      expect(notebook.notes).toHaveLength(2)
      expect(notebook.notes[0]?.headings).toBeUndefined()
    })

    it('見出しのみのファイルはテキストが空のノートを生成すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 給排水設備

## 排煙設備
`,
      )
      expect(notebook.notes.length).toBe(2)
      for (const note of notebook.notes) {
        expect(note.text).toBe('')
      }
    })
  })

  describe('parse - 祖先見出し一覧の蓄積', () => {
    it('見出しスタックを浅い順に設定すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 地盤調査

建設予定地の地盤特性を把握するために標準貫入試験を実施する。

## 支持力の算定

地盤の許容支持力を計算して基礎形式を選定する。

### 地耐力の検証

載荷試験で実測値と計算値を照合する。
`,
      )
      expect(notebook.notes[0]?.headings).toHaveLength(1)
      expect(notebook.notes[0]?.headings?.[0]?.depth).toBe(1)
      expect(notebook.notes[0]?.headings?.[0]?.text).toBe('地盤調査')

      expect(notebook.notes[1]?.headings).toHaveLength(2)
      expect(notebook.notes[1]?.headings?.[0]?.depth).toBe(1)
      expect(notebook.notes[1]?.headings?.[1]?.depth).toBe(2)
      expect(notebook.notes[1]?.headings?.[1]?.text).toBe('支持力の算定')

      expect(notebook.notes[2]?.headings).toHaveLength(3)
      expect(notebook.notes[2]?.headings?.[2]?.depth).toBe(3)
      expect(notebook.notes[2]?.headings?.[2]?.text).toBe('地耐力の検証')
    })

    it('見出しの深さが低下するとスタックをリセットすること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 鉄骨造

鋼材を骨組みに使用する。

## 接合部

溶接やボルトで接合する。

# 木造

木材を主要構造材に使用する。
`,
      )
      expect(notebook.notes.length).toBe(3)
      expect(notebook.notes[2]?.headings).toHaveLength(1)
      expect(notebook.notes[2]?.headings?.[0]?.text).toBe('木造')
    })

    it('見出しの深さが飛ぶ場合はそのまま反映すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 鉄筋コンクリート造

圧縮力と引張力の両方に耐える。

### 配筋設計

主筋とせん断補強筋を配置する。
`,
      )
      expect(notebook.notes.length).toBe(2)
      expect(notebook.notes[1]?.headings).toHaveLength(2)
      expect(notebook.notes[1]?.headings?.[0]?.depth).toBe(1)
      expect(notebook.notes[1]?.headings?.[0]?.text).toBe('鉄筋コンクリート造')
      expect(notebook.notes[1]?.headings?.[1]?.depth).toBe(3)
      expect(notebook.notes[1]?.headings?.[1]?.text).toBe('配筋設計')
    })
  })

  describe('parse - テキストの抽出', () => {
    it('Markdown 記法を除去してプレーンテキストを抽出すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# シェル構造

**薄板構造**は曲面に成形した薄い板で荷重を支える。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).toContain('薄板構造')
      expect(notebook.notes[0]?.text).toContain('曲面に成形した薄い板で荷重を支える')
      expect(notebook.notes[0]?.text).not.toContain('**')
    })

    it('コードブロックの内容を除外すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 応力度計算

\`\`\`typescript
const value = 42
\`\`\`

許容応力度と比較して部材の安全性を確認する。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]).not.toContain('const value')
      expect(notebook.notes[0]?.text).toContain('許容応力度と比較して部材の安全性を確認する')
      expect(notebook.notes[0]?.text).not.toContain('```')
    })

    it('インラインコードの内容を含めること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 施工管理

掘削工事では \`山留め工法\` を適用する。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).toContain('山留め工法')
      expect(notebook.notes[0]?.text).not.toContain('`')
    })

    it('リストをフラット化して含めること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 屋根形式

- 切妻屋根
- 寄棟屋根
  - 入母屋屋根
- 陸屋根
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).toContain('切妻屋根')
      expect(notebook.notes[0]?.text).toContain('寄棟屋根')
      expect(notebook.notes[0]?.text).toContain('入母屋屋根')
      expect(notebook.notes[0]?.text).toContain('陸屋根')
      expect(notebook.notes[0]?.text).not.toContain('-')
    })

    it('テーブルのセル内容を含めること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 外壁仕上げ

| 工法 | 特徴 |
|---|---|
| カーテンウォール | 非耐力の外装パネルを取り付ける |
| 打放しコンクリート | 型枠の跡をそのまま仕上げ面とする |
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).toContain('カーテンウォール')
      expect(notebook.notes[0]?.text).toContain('非耐力の外装パネルを取り付ける')
      expect(notebook.notes[0]?.text).toContain('打放しコンクリート')
      expect(notebook.notes[0]?.text).toContain('型枠の跡をそのまま仕上げ面とする')
      expect(notebook.notes[0]?.text).not.toContain('---')
      expect(notebook.notes[0]?.text).not.toContain('|')
    })

    it('見出しテキストをプレーンテキストに含めないこと', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 免震構造

積層ゴム支承で建物と地盤を絶縁して地震の揺れを吸収する。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).not.toContain('免震構造')
      expect(notebook.notes[0]?.text).toContain(
        '積層ゴム支承で建物と地盤を絶縁して地震の揺れを吸収する',
      )
    })

    it('リンクの表示テキストを含め URL を捨てること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 法規

[建築基準法の解説](https://example.com/kijun)を参照する。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).toContain('建築基準法の解説')
      expect(notebook.notes[0]?.text).not.toContain('https://example.com/kijun')
    })

    it('画像の代替テキストを含めること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 宗教建築

![ゴシック大聖堂の断面図](cathedral.png)
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).toContain('ゴシック大聖堂の断面図')
    })

    it('ノート内の改行を含めること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 基礎工法

直接基礎は地盤に載せる工法である。

杭基礎は支持層まで杭を打ち込む工法である。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.text).toBe(
        '直接基礎は地盤に載せる工法である。\n杭基礎は支持層まで杭を打ち込む工法である。',
      )
    })
  })

  describe('parse - 強調マーク一覧の抽出', () => {
    it('強調マークを正しいオフセットで記録すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# ヴォールト

**アーチ構造**を連続させて天井面を形成する技法。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.emphases).toHaveLength(1)
      expect(notebook.notes[0]?.emphases?.[0]?.span.text).toBe('アーチ構造')
      expect(notebook.notes[0]?.emphases?.[0]?.span.offset).toBe(0)
      expect(notebook.notes[0]?.emphases?.[0]?.kind).toBe('strong')
    })

    it('先頭以外の位置にある強調マークのオフセットが正しいこと', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 壁構造

建築における **耐力壁** の役割。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.emphases).toHaveLength(1)
      expect(notebook.notes[0]?.emphases?.[0]?.span.text).toBe('耐力壁')
      expect(notebook.notes[0]?.emphases?.[0]?.span.offset).toBe('建築における '.length)
    })

    it('ネストした強調マークは外側のみ強調マークとして記録すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
**外壁材 **内壁材** の選定**
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.emphases).toHaveLength(1)
      expect(notebook.notes[0]?.emphases?.[0]?.span.text).toBe('外壁材 内壁材 の選定')
    })

    it('抽出できない場合は強調マーク一覧を持たないこと', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 断熱性能

断熱材を充填して熱貫流率を低減させる。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.emphases).toBeUndefined()
    })
  })

  describe('parse - 行番号対応一覧の構築', () => {
    it('テキストのソースファイル行番号を記録すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 梁設計

曲げモーメントを算定して断面を決定する。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.origins).toHaveLength(1)
      expect(notebook.notes[0]?.origins[0]?.offset).toBe(0)
      expect(notebook.notes[0]?.origins[0]?.line).toBe(4)
    })

    it('同一行の連続テキストで行番号対応を重複させないこと', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 骨組構造

**ラーメン構造** は柱と梁の剛接合で構成される。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.origins).toHaveLength(1)
    })

    it('複数行にまたがるテキストで行番号対応一覧を記録すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '建築構造.md',
        `
# 工法比較

在来工法は木材を軸組みする。

ツーバイフォー工法は面で構造を支える。
`,
      )
      expect(notebook.notes).toHaveLength(1)
      expect(notebook.notes[0]?.origins.length).toBe(2)
    })
  })

  describe('parse - ソースファイルのパス伝播', () => {
    it('全ノートにソースファイルのパスを設定すること', () => {
      const parser = new MarkdownParser()
      const notebook = parser.parse(
        '/structures/建築構造.md',
        `
# 都市計画

用途地域の指定により建築物の用途と規模を制限する。
`,
      )
      for (const note of notebook.notes) {
        expect(note.source).toBe('/structures/建築構造.md')
      }
    })
  })
})
