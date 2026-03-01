import type { Heading as MdastHeading, Root, RootContent } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { Emphasis, Note, Notebook, Origin } from '../../models/note.js'
import type { Parser } from '../parser.js'

/**
 * mdast の走査中に蓄積する可変状態
 *
 * 1パスでプレーンテキスト、行番号対応表、強調マークを同時に組み立てるために使用する
 */
type TraversalState = {
  /**
   * プレーンテキストの断片を蓄積するバッファ
   *
   * 走査完了後に結合してプレーンテキストを生成する
   */
  buffer: string[]
  /**
   * 現在の文字オフセット
   *
   * バッファの合計長に等しい
   * Emphasis の出現位置と Origin のオフセットの計算に使用する
   */
  offset: number
  /**
   * プレーンテキストのオフセットとソースファイル行番号の対応表
   *
   * テキスト追加時に、直前と異なる行番号であれば新しいエントリを追加する
   */
  origins: Origin[]
  /**
   * 検出した太字の一覧
   *
   * 太字ノードの走査時に出現位置を記録して生成する
   */
  emphases: Emphasis[]
}

/**
 * 祖先見出しスタックの1エントリ
 *
 * ノートの祖先見出し計算に使用する
 */
type HeadingEntry = {
  /**
   * 見出しの深さ
   */
  depth: number
  /**
   * 見出しテキスト
   */
  text: string
  /**
   * ソースファイル内の行番号
   */
  line: number
}

/**
 * ノート分割の中間表現
 *
 * 見出し分割で生成し、Note への変換で消費する
 */
type RawNote = {
  /**
   * この区間の見出し
   *
   * 冒頭ノート、つまり見出しより前のテキストでは null になる
   */
  heading: MdastHeading | null
  /**
   * 見出し間のコンテンツノード一覧
   */
  nodes: RootContent[]
}

/**
 * Markdown ファイルの Parser
 *
 * unified + remark-parse + remark-gfm で mdast を取得し、自前の変換ロジックで Note に変換する
 */
class MarkdownParser implements Parser {
  /**
   * Markdown ファイルを解析して Notebook を生成する
   *
   * 空ファイルの場合はノート一覧が空の Notebook を返す
   * 入力文字列を元テキストとして格納する
   * プレーンテキストは構造を失っているため、Publisher が成果物を生成する際に元テキストを使用する
   *
   * @param source - ファイルパスを指定する
   * @param content - ファイルの中身の文字列を指定する
   * @returns 解析結果の Notebook を返す
   */
  parse = (source: string, content: string): Notebook => {
    if (content.trim() === '') {
      return { source, notes: [], raw: content }
    }

    const processor = unified().use(remarkParse).use(remarkGfm)
    const tree = processor.parse(content) as Root

    const fragments = this.split(tree)
    const notes = this.build(source, fragments)

    return { source, notes, raw: content }
  }

  /**
   * mdast の root.children を見出しで区切り RawNote の配列を返す
   *
   * 見出しノードに遭遇するたびに新しい RawNote を開始する
   * ファイルが見出しで始まる場合、冒頭の空ノートは破棄する
   *
   * @param tree - remark-parse が生成した mdast の Root ノードを指定する
   * @returns 見出しで区切られた RawNote の配列を返す
   */
  private split = (tree: Root): RawNote[] => {
    const result: RawNote[] = []
    let current: RawNote = { heading: null, nodes: [] }

    for (const node of tree.children) {
      if (node.type === 'heading') {
        /**
         * 現在のノートに見出しがあるかコンテンツがあれば一覧に追加する
         * 両方とも空の場合、つまりファイル先頭が見出しの場合は追加しない
         */
        if (current.heading !== null || current.nodes.length > 0) {
          result.push(current)
        }
        current = { heading: node, nodes: [] }
      } else {
        current.nodes.push(node)
      }
    }

    /**
     * 最後のノートを追加する
     * 見出しもコンテンツも空なら追加しない
     */
    if (current.heading !== null || current.nodes.length > 0) {
      result.push(current)
    }

    return result
  }

  /**
   * RawNote の配列から Note の配列を生成する
   *
   * 祖先見出しのスタックを管理し、各ノートに見出しを設定する
   * 各ノートのコンテンツを走査してプレーンテキスト、行番号対応表、強調マークを組み立てる
   *
   * @param source - ファイルパスを指定する
   * @param fragments - 見出し分割で生成した RawNote の配列を指定する
   * @returns 生成した Note の配列を返す
   */
  private build = (source: string, fragments: RawNote[]): Note[] => {
    const stack: HeadingEntry[] = []
    const notes: Note[] = []

    for (const fragment of fragments) {
      if (fragment.heading !== null) {
        const line = fragment.heading.position?.start.line ?? 0
        const title = this.extract(fragment.heading.children as RootContent[])
        const depth = fragment.heading.depth

        /**
         * スタックから現在の深さ以上のエントリをすべて除去する
         * これにより見出しの深さが低下した場合にスタックがリセットされる
         */
        while (stack.length > 0 && (stack[stack.length - 1]?.depth ?? 0) >= depth) {
          stack.pop()
        }
        stack.push({ depth, text: title, line })
      }

      const state: TraversalState = {
        buffer: [],
        offset: 0,
        origins: [],
        emphases: [],
      }

      for (const node of fragment.nodes) {
        this.visit(node, state, false)
      }

      const text = state.buffer.join('')
      const note: Note = {
        source,
        text,
        origins: state.origins,
      }

      /**
       * 冒頭ノートには見出しを設定しない
       * exactOptionalPropertyTypes により undefined の明示的代入はできないため、条件付きでプロパティを追加する
       */
      if (fragment.heading !== null) {
        note.headings = stack.map((entry) => ({
          depth: entry.depth,
          text: entry.text,
          line: entry.line,
        }))
      }

      /**
       * 太字が存在しない場合は強調マークを設定しない
       */
      if (state.emphases.length > 0) {
        note.emphases = state.emphases
      }

      notes.push(note)
    }

    return notes
  }

  /**
   * mdast ノードの子を走査してテキストのみ結合する
   *
   * 見出しのテキスト抽出専用である
   * プレーンテキストの組み立てには別の走査メソッドを使用する
   *
   * @param children - 見出しノードの children を指定する
   * @returns 結合したテキストを返す
   */
  private extract = (children: RootContent[]): string => {
    const parts: string[] = []
    for (const child of children) {
      if (child.type === 'text') {
        parts.push(child.value)
      } else if (child.type === 'inlineCode') {
        parts.push(child.value)
      } else if ('children' in child) {
        parts.push(this.extract(child.children as RootContent[]))
      }
    }
    return parts.join('')
  }

  /**
   * ノード種別ごとに処理を振り分け、プレーンテキスト、行番号対応表、強調マークを組み立てる
   *
   * ネストフラグにより太字の入れ子を検出し、外側の太字のみ Emphasis として記録する
   *
   * @param node - 処理対象の mdast ノードを指定する
   * @param state - 走査中の可変状態を指定する
   * @param nested - 現在 strong ノードの内部にいるかどうかを指定する
   */
  private visit = (node: RootContent, state: TraversalState, nested: boolean): void => {
    switch (node.type) {
      /**
       * 段落を処理する
       * 処理開始前にブロック区切りの改行を挿入し、子を再帰処理する
       */
      case 'paragraph': {
        this.separate(state)
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }
        break
      }

      /**
       * 引用を処理する
       * マーカーを除去し、子を再帰処理する
       * 引用内に定義文が含まれるケースがあるため text に含める
       */
      case 'blockquote': {
        this.separate(state)
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }
        break
      }

      /**
       * リストを処理する
       * マーカーを除去し、子のリスト項目を再帰処理する
       */
      case 'list': {
        this.separate(state)
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }
        break
      }

      /**
       * リスト項目を処理する
       * ネストされたリストもフラットに改行区切りで出力する
       */
      case 'listItem': {
        this.separate(state)
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }
        break
      }

      /**
       * テーブルを処理する
       * セル間をスペース、行間を改行で区切り、専用メソッドで処理する
       */
      case 'table': {
        this.separate(state)
        this.flatten(node, state)
        break
      }

      /**
       * テキストノードを処理する
       * バッファに追加し、Origin を記録する
       */
      case 'text': {
        this.append(node.value, node.position?.start.line ?? 0, state)
        break
      }

      /**
       * インラインコードを処理する
       * バッククォートを除去してテキストとして追加する
       * 用語がバッククォートで囲まれる慣習が多いため text に含める
       */
      case 'inlineCode': {
        this.append(node.value, node.position?.start.line ?? 0, state)
        break
      }

      /**
       * 太字を処理する
       * 外側の strong のみ Emphasis として記録する
       * ネストした太字を個別に記録するとオフセット範囲が重複し、Finder の走査に影響するため外側のみとする
       */
      case 'strong': {
        if (!nested) {
          const start = state.offset
          const mark = state.buffer.length
          for (const child of node.children) {
            this.visit(child as RootContent, state, true)
          }
          /**
           * バッファの追加分を結合してマッチテキストを生成する
           */
          const captured = state.buffer.slice(mark).join('')
          state.emphases.push({
            span: { text: captured, offset: start },
            kind: 'strong',
          })
        } else {
          /**
           * ネストした太字はテキストだけ処理し、Emphasis は生成しない
           */
          for (const child of node.children) {
            this.visit(child as RootContent, state, true)
          }
        }
        break
      }

      /**
       * イタリックを処理する
       * テキストだけ処理し、Emphasis は生成しない
       * 現在の強調種別は太字のみである
       */
      case 'emphasis': {
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }
        break
      }

      /**
       * 取り消し線を処理する
       * テキストだけ処理し、構造は捨てる
       */
      case 'delete': {
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }
        break
      }

      /**
       * リンクを処理する
       * URL は捨て、表示テキストだけ拾う
       * 表示テキストに用語が含まれるケースがあるため text に含める
       */
      case 'link': {
        for (const child of node.children) {
          this.visit(child as RootContent, state, nested)
        }
        break
      }

      /**
       * 画像を処理する
       * alt テキストがあればテキストとして追加する
       * alt に用語が含まれるケースがあるため text に含める
       */
      case 'image': {
        if (node.alt) {
          this.append(node.alt, node.position?.start.line ?? 0, state)
        }
        break
      }

      /**
       * テキストを含まないノードをスキップする
       * code はコードブロックでありソースコードのため走査対象外とする
       * html はインライン HTML であり生の HTML タグのため走査対象外とする
       * thematicBreak は水平線でありテキストではないため走査対象外とする
       */
      case 'code':
      case 'html':
      case 'thematicBreak': {
        break
      }

      /**
       * 上記以外のノードを処理する
       * 子があれば再帰処理するフォールバックである
       */
      default: {
        if ('children' in node) {
          for (const child of (node as { children: RootContent[] }).children) {
            this.visit(child, state, nested)
          }
        }
        break
      }
    }
  }

  /**
   * テーブルのセル内容を処理する
   *
   * セル間をスペース、行間を改行で区切ってバッファに追加する
   * テキスト依存ルールがプレーンテキストを走査できるようにする
   *
   * @param node - テーブルノードを指定する
   * @param state - 走査中の可変状態を指定する
   */
  private flatten = (node: { children: RootContent[] }, state: TraversalState): void => {
    for (const [index, row] of node.children.entries()) {
      if (index > 0) {
        this.pad('\n', state)
      }
      if (row && 'children' in row) {
        const cells = (row as { children: RootContent[] }).children
        for (const [position, cell] of cells.entries()) {
          if (position > 0) {
            this.pad(' ', state)
          }
          if (cell && 'children' in cell) {
            for (const child of (cell as { children: RootContent[] }).children) {
              this.visit(child, state, false)
            }
          }
        }
      }
    }
  }

  /**
   * バッファが空でなければブロック区切りの改行を挿入する
   *
   * ブロック要素の処理開始前に呼び出す
   * これによりブロック要素間が常に単一改行で区切られる
   *
   * @param state - 走査中の可変状態を指定する
   */
  private separate = (state: TraversalState): void => {
    if (state.buffer.length > 0) {
      this.pad('\n', state)
    }
  }

  /**
   * テキストをバッファに追加し、offset を進め、行番号が変わっていれば Origin を記録する
   *
   * 同一行からの連続追加では Origin を重複させない
   *
   * @param value - 追加するテキストを指定する
   * @param line - テキストが由来するソースファイルの行番号を指定する
   * @param state - 走査中の可変状態を指定する
   */
  private append = (value: string, line: number, state: TraversalState): void => {
    const previous = state.origins[state.origins.length - 1]
    if (previous === undefined || previous.line !== line) {
      state.origins.push({ offset: state.offset, line })
    }
    state.buffer.push(value)
    state.offset += value.length
  }

  /**
   * Origin を記録せずに区切り文字をバッファに追加する
   *
   * ブロック要素間の改行やテーブルのセル区切りに使用する
   * 改行自体は新しいソース行に対応しないため Origin を追加しない
   *
   * @param value - 追加する区切り文字を指定する
   * @param state - 走査中の可変状態を指定する
   */
  private pad = (value: string, state: TraversalState): void => {
    state.buffer.push(value)
    state.offset += value.length
  }
}

export default MarkdownParser
