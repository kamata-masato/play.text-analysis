/**
 * 組み込みルールの定義
 *
 * 各 Finder と1対1で対応する
 */
const BuiltinRules = {
  BoldText: 'bold-text',
  TohaInBody: 'toha-in-body',
  TohaInHeading: 'toha-in-heading',
  HaInBody: 'ha-in-body',
  AliasInParentheses: 'alias-in-parentheses',
  JapaneseSupplementInParentheses: 'japanese-supplement-in-parentheses',
  AbbreviationAfterColon: 'abbreviation-after-colon',
} as const

/**
 * ルール
 *
 * 各 Finder が どのように Hint を見つけるかを定義する識別子
 */
type Rule = (typeof BuiltinRules)[keyof typeof BuiltinRules]

export { BuiltinRules }
export type { Rule }
