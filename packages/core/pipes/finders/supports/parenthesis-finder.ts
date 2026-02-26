type Parenthesis = {
  outside: string
  inside: string
  span: { text: string; offset: number }
}

const ParenthesisPattern = new RegExp(
  '(?<outside>[^(\\n。、（）()]+?)[（(](?<inside>[^）)]+)[）)]',
  'g',
)

const find = (text: string): Parenthesis[] => {
  const parentheses: Parenthesis[] = []

  const cursor = new RegExp(ParenthesisPattern.source, ParenthesisPattern.flags)
  let matched: RegExpExecArray | null
  while ((matched = cursor.exec(text)) !== null) {
    const outside = matched.groups!['outside']!
    const inside = matched.groups!['inside']!

    if (outside.trim() === '' || inside.trim() === '') {
      continue
    }

    parentheses.push({
      outside,
      inside,
      span: { text: matched[0], offset: matched.index },
    })
  }

  return parentheses
}

const ParenthesisFinder = {
  find,
}

export { ParenthesisFinder }
export type { Parenthesis }
