const JapaneseEndingText =
  'のことである|のことです|のこと|を意味します|を意味する|を指します|を指す|の略称です|の略称|の略です|の略|である|です'

const AliasIdentifierPattern = new RegExp('^[A-Z][A-Z0-9./-]+$')

export { JapaneseEndingText, AliasIdentifierPattern }
