const UniversalDelimiterText = '\n。、'

const ParenthesisStructurePattern = new RegExp(
  '(?<outside>[^(\\n。、（）()]+?)[（(](?<inside>[^）)]+)[）)]',
  'g',
)

export { UniversalDelimiterText, ParenthesisStructurePattern }
