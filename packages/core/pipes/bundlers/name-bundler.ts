import type { Prospect } from '../../models/concept.js'
import type { Evidence } from '../../models/evidence.js'
import type { Bundler } from './bundler.js'

const FullWidthConversionOffset = 0xfee0

const FullWidthSpacePattern = new RegExp('\u3000', 'g')

const FullWidthAlphanumericPattern = new RegExp('[Ａ-Ｚａ-ｚ０-９]', 'g')

const JapaneseLeadingParticlePattern = new RegExp('^[とや]')

const JapaneseRejectableLeadingParticlePattern = new RegExp('^[をのにがでは]')

const JapaneseClauseEndingPattern = new RegExp(
  '(?:する|される|させ|します|されます|ます|ました|ません|れる|いる|ある|った|ない|を実行)$',
)

const JapaneseClauseParticlePattern = new RegExp('[のにをがではやと]', 'g')

const FullWidthParentheticalContentPattern = new RegExp('（[^）]*）', 'g')

const MinimumParticleCountForClause = 2

const MaximumNameLength = 20

const JapaneseDemonstrativePattern = new RegExp(
  '^(?:これ|ここ|この|その|それ|あの|あれ|そして|まず|どう|なぜ|または)',
)

const NumberedPrefixPattern = new RegExp('^\\d+\\.\\s+')

const OpenQuote = '「'

const CloseQuote = '」'

const TruncatedKotoPattern = new RegExp('こ$')

const SingleLetterPattern = new RegExp('^[A-Z]$')

const MarkerPrefixPattern = new RegExp('^[・→]')

const YearExpressionPattern = new RegExp('^\\d+\\s*年$')

const CommaPattern = new RegExp(',')

const ColonSeparatorPattern = new RegExp(': ')

const HiraganaIEndingPattern = new RegExp('い$')

const MathSymbolPattern = new RegExp('\\$\\$')

const AtPrefixPattern = new RegExp('^@')

const BracePattern = new RegExp('[{}]')

class NameBundler implements Bundler {
  bundle = (evidences: Evidence[]): Prospect[] => {
    const groups = new Map<string, Evidence[]>()

    for (const evidence of evidences) {
      const key = this.normalize(evidence.hint.name)
      const findings = groups.get(key)

      if (findings) {
        findings.push(evidence)
      } else {
        groups.set(key, [evidence])
      }
    }

    const prospects: Prospect[] = []
    for (const [, findings] of groups) {
      const first = findings[0]!
      const name = this.strip(
        first.hint.name
          .trim()
          .replace(NumberedPrefixPattern, '')
          .replace(FullWidthParentheticalContentPattern, '')
          .trim(),
      )

      if (this.reject(name)) {
        continue
      }

      prospects.push({ name, evidences: findings })
    }

    return prospects
  }

  private reject = (name: string): boolean => {
    if (name.length > MaximumNameLength) {
      return true
    }

    if (JapaneseRejectableLeadingParticlePattern.test(name)) {
      return true
    }

    if (JapaneseClauseEndingPattern.test(name)) {
      return true
    }

    const particles = name.match(JapaneseClauseParticlePattern)
    if (particles !== null && particles.length >= MinimumParticleCountForClause) {
      return true
    }

    if (JapaneseDemonstrativePattern.test(name)) {
      return true
    }

    if (name.includes(OpenQuote) && !name.includes(CloseQuote)) {
      return true
    }

    if (TruncatedKotoPattern.test(name)) {
      return true
    }

    if (SingleLetterPattern.test(name)) {
      return true
    }

    if (MarkerPrefixPattern.test(name)) {
      return true
    }

    if (YearExpressionPattern.test(name)) {
      return true
    }

    if (CommaPattern.test(name)) {
      return true
    }

    if (ColonSeparatorPattern.test(name)) {
      return true
    }

    if (HiraganaIEndingPattern.test(name)) {
      return true
    }

    if (MathSymbolPattern.test(name)) {
      return true
    }

    if (AtPrefixPattern.test(name)) {
      return true
    }

    if (BracePattern.test(name)) {
      return true
    }

    return false
  }

  private normalize = (name: string): string => {
    let normalized = name.trim()
    normalized = normalized.replace(NumberedPrefixPattern, '')
    normalized = this.strip(normalized)

    normalized = normalized.replace(FullWidthParentheticalContentPattern, '')
    normalized = normalized.trim()

    normalized = normalized.replace(FullWidthAlphanumericPattern, (character) =>
      String.fromCharCode(character.charCodeAt(0) - FullWidthConversionOffset),
    )

    normalized = normalized.replace(FullWidthSpacePattern, ' ')

    normalized = normalized.toLowerCase()

    return normalized
  }

  private strip = (name: string): string => {
    const stripped = name.replace(JapaneseLeadingParticlePattern, '').trim()

    return stripped === '' ? name : stripped
  }
}

export { NameBundler }
