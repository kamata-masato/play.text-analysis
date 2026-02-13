import type { Element, ElementContent, Root as HastRoot, Text } from 'hast'

type Anchor = {
  lines: Set<number>
}

type Placement = {
  start: number
  end: number
  name: string
}

const IdentifierClassName = 'glossa'

const annotate = (tree: HastRoot, names: string[], anchors: Map<string, Anchor>): HastRoot => {
  walk(tree, names, anchors)

  return tree
}

const walk = (parent: Element | HastRoot, names: string[], anchors: Map<string, Anchor>): void => {
  const replaced: ElementContent[] = []

  let changed = false
  for (const child of parent.children) {
    if (child.type === 'element') {
      if (inside(child)) {
        replaced.push(child)
      } else {
        walk(child, names, anchors)
        replaced.push(child)
      }
    } else if (child.type === 'text') {
      const placements = find(child.value, names)

      if (placements.length > 0) {
        for (const fragment of split(child, placements, anchors)) {
          replaced.push(fragment)
        }

        changed = true
      } else {
        replaced.push(child)
      }
    } else {
      replaced.push(child as ElementContent)
    }
  }

  if (changed) {
    parent.children = replaced as typeof parent.children
  }
}

const inside = (element: Element): boolean => {
  const classes = element.properties?.className

  if (Array.isArray(classes)) {
    return classes.includes(IdentifierClassName)
  }

  return false
}

const find = (text: string, names: string[]): Placement[] => {
  const reserved: Placement[] = []

  for (const name of names) {
    let position = 0
    while (true) {
      const found = text.indexOf(name, position)

      if (found === -1) {
        break
      }

      const start = found
      const end = found + name.length
      const overlaps = reserved.some((placement) => start < placement.end && end > placement.start)

      if (!overlaps) {
        reserved.push({ start, end, name })
      }

      position = found + 1
    }
  }

  reserved.sort((a, b) => a.start - b.start)

  return reserved
}

const split = (
  node: Text,
  placements: Placement[],
  anchors: Map<string, Anchor>,
): ElementContent[] => {
  const fragments: ElementContent[] = []
  const line = node.position?.start.line ?? 0

  let cursor = 0
  for (const placement of placements) {
    if (placement.start > cursor) {
      fragments.push({ type: 'text', value: node.value.slice(cursor, placement.start) })
    }

    const properties: Element['properties'] = {
      className: [IdentifierClassName],
      dataGlossaConcept: placement.name,
    }

    if (anchors.get(placement.name)?.lines.has(line)) {
      properties.id = `${IdentifierClassName}-${placement.name}-${line}`
    }

    fragments.push({
      type: 'element',
      tagName: 'span',
      properties,
      children: [{ type: 'text', value: placement.name }],
    })

    cursor = placement.end
  }

  if (cursor < node.value.length) {
    fragments.push({ type: 'text', value: node.value.slice(cursor) })
  }

  return fragments
}

const HtmlAnnotator = { annotate }

export { HtmlAnnotator, IdentifierClassName }
export type { Anchor }
