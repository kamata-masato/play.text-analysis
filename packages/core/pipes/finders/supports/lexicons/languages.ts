const JapaneseCharacterPattern = new RegExp(
  '[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]',
)

const EnglishCharacterPattern = new RegExp('[A-Za-z]')

export { JapaneseCharacterPattern, EnglishCharacterPattern }
