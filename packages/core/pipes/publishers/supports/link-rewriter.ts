import { dirname, posix } from 'node:path'
import type { Element, Root as HastRoot } from 'hast'

const AbsoluteUrlPattern = new RegExp('^(?:https?://|//|mailto:|tel:)')

const FileExtensionPattern = new RegExp('\\.[^.]+$')

const rewrite = (tree: HastRoot, source: string, available: Set<string>): void => {
  walk(tree, source, available)
}

const walk = (parent: Element | HastRoot, source: string, available: Set<string>): void => {
  for (const child of parent.children) {
    if (child.type !== 'element') {
      continue
    }

    if (child.tagName === 'a') {
      const href = String(child.properties?.href ?? '')

      if (href !== '' && !href.startsWith('#') && !AbsoluteUrlPattern.test(href)) {
        const rewritten = resolve(href, source, available)

        if (rewritten !== null) {
          child.properties = { ...child.properties, href: rewritten }
        }
      }
    }

    walk(child, source, available)
  }
}

const resolve = (href: string, source: string, available: Set<string>): string | null => {
  const fragment = href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : ''
  const path = href.includes('#') ? (href.split('#')[0] ?? '') : href

  if (path === '') {
    return null
  }

  const standard = posix.normalize(posix.join(dirname(source), path))
  let matched = lookup(standard, available)

  if (matched === null) {
    const stem = source.replace(FileExtensionPattern, '')
    const virtual = posix.normalize(posix.join(dirname(posix.join(stem, 'index')), path))
    matched = lookup(virtual, available)
  }

  if (matched === null) {
    return null
  }

  const relative = posix.relative(
    dirname(source.replace(FileExtensionPattern, '.html')),
    matched.replace(FileExtensionPattern, '.html'),
  )

  return relative + fragment
}

const lookup = (resolved: string, available: Set<string>): string | null => {
  const clean = resolved.endsWith('/') ? resolved.slice(0, -1) : resolved

  if (available.has(clean)) {
    return clean
  }

  if (!FileExtensionPattern.test(clean)) {
    if (available.has(`${clean}.md`)) {
      return `${clean}.md`
    }

    if (available.has(`${clean}/index.md`)) {
      return `${clean}/index.md`
    }
  }

  const md = clean.replace(FileExtensionPattern, '.md')
  if (md !== clean && available.has(md)) {
    return md
  }

  return null
}

const LinkRewriter = { rewrite }

export { LinkRewriter }
