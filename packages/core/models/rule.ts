const BuiltinRules = {
  BoldText: 'bold-text',
  TohaInBody: 'toha-in-body',
  TohaInHeading: 'toha-in-heading',
  HaInBody: 'ha-in-body',
  AliasInParentheses: 'alias-in-parentheses',
  JapaneseSupplementInParentheses: 'japanese-supplement-in-parentheses',
  AbbreviationAfterColon: 'abbreviation-after-colon',
} as const

type Rule = (typeof BuiltinRules)[keyof typeof BuiltinRules]

export { BuiltinRules }
export type { Rule }
