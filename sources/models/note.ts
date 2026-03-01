/**
 * テキスト内の位置付きスパン
 */
type Span = {
  /**
   * 対象テキスト
   */
  text: string
  /**
   * ノート内での文字オフセット
   */
  offset: number
}

/**
 * 強調の種別
 */
type EmphasisKind = 'strong'

/**
 * 強調マーク
 *
 * Finder が太字テキストを識別するために使用する
 */
type Emphasis = {
  /**
   * 対象スパン
   */
  span: Span
  /**
   * 強調の種別
   */
  kind: EmphasisKind
}

/**
 * 見出し
 *
 * Parser がノート分割時に生成し、祖先見出しとして Note に格納する
 * Finder が見出しテキストを走査するために参照する
 */
type Heading = {
  /**
   * 見出しの深さ
   *
   * 1 から 6 の値をとる
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
 * プレーンテキストのオフセットとソースファイル行番号の対応
 *
 * Finder がプレーンテキスト内のマッチ位置からソースファイルの行番号を逆引きするために使用する
 */
type Origin = {
  /**
   * プレーンテキスト内の開始オフセット
   */
  offset: number
  /**
   * ソースファイルの行番号
   */
  line: number
}

/**
 * 中間表現の最小処理単位
 *
 * Parser が見出しで区切って生成し、Finder が走査する対象となる
 */
type Note = {
  /**
   * ソースファイルのパス
   */
  source: string
  /**
   * 構造を除去したプレーンテキスト
   *
   * Finder の正規表現マッチの対象となる
   */
  text: string
  /**
   * プレーンテキストのオフセットとソースファイル行番号の対応表
   *
   * offset の昇順で格納する
   * Finder が二分探索でソース行番号を取得する
   */
  origins: Origin[]
  /**
   * 祖先見出しの一覧
   *
   * 浅い順に格納する
   * 冒頭ノート、つまり見出しより前のテキストでは undefined になる
   */
  headings?: Heading[]
  /**
   * 強調マークの一覧
   *
   * 太字が存在しない場合は undefined になる
   */
  emphases?: Emphasis[]
}

/**
 * 1ファイル分の Note のまとまり
 *
 * Parser がファイル単位で生成する
 * Publisher がファイル単位で成果物を出力するために使用する
 */
type Notebook = {
  /**
   * ソースファイルのパス
   */
  source: string
  /**
   * ノートの一覧
   */
  notes: Note[]
  /**
   * 元のファイル内容
   *
   * Parser への入力文字列をそのまま格納する
   * プレーンテキストは構造を失っているため、Publisher が成果物を生成する際にこの値を使用する
   */
  raw: string
}

export type { Span, EmphasisKind, Emphasis, Heading, Origin, Note, Notebook }
