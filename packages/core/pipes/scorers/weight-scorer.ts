import type { Concept, Prospect } from '../../models/concept.js'
import type { Evidence } from '../../models/evidence.js'
import { BuiltinRules, type Rule } from '../../models/rule.js'
import type { Scorer } from './scorer.js'

const Rates = [1.0, 0.5]

const Threshold = 3

const Weights: Record<Rule, number> = {
  [BuiltinRules.BoldText]: 2,
  [BuiltinRules.TohaInBody]: 3,
  [BuiltinRules.TohaInHeading]: 3,
  [BuiltinRules.HaInBody]: 1,
  [BuiltinRules.AliasInParentheses]: 3,
  [BuiltinRules.JapaneseSupplementInParentheses]: 1,
  [BuiltinRules.AbbreviationAfterColon]: 3,
}

const Priorities: Rule[] = [
  BuiltinRules.TohaInBody,
  BuiltinRules.TohaInHeading,
  BuiltinRules.HaInBody,
  BuiltinRules.AliasInParentheses,
  BuiltinRules.AbbreviationAfterColon,
  BuiltinRules.JapaneseSupplementInParentheses,
  BuiltinRules.BoldText,
]

const DemonstrativePattern = new RegExp('^この')

const PredicatePattern = new RegExp('[\\u3040-\\u309F]$')

const DemonstrativeThreshold = 30

const ShortThreshold = 20

class WeightScorer implements Scorer {
  score = (prospects: Prospect[]): Concept[] => {
    const concepts: Concept[] = []

    for (const prospect of prospects) {
      const groups = new Map<Rule, Evidence[]>()

      for (const evidence of prospect.evidences) {
        const findings = groups.get(evidence.rule)

        if (findings) {
          findings.push(evidence)
        } else {
          groups.set(evidence.rule, [evidence])
        }
      }

      let total = 0
      for (const [rule, evidences] of groups) {
        const weight = Weights[rule]
        const count = Math.min(evidences.length, Rates.length)

        for (let index = 0; index < count; index++) {
          total += Math.floor(weight * Rates[index]!)
        }
      }

      if (total < Threshold) {
        continue
      }

      const description = this.describe(groups)

      concepts.push({
        name: prospect.name,
        evidences: prospect.evidences,
        score: total,
        description,
      })
    }

    return concepts
  }

  private describe = (grouped: Map<Rule, Evidence[]>): string => {
    let fallback: string | undefined

    for (const rule of Priorities) {
      const evidences = grouped.get(rule)

      if (evidences === undefined) {
        continue
      }

      for (const evidence of evidences) {
        if (evidence.hint.description !== undefined) {
          if (fallback === undefined) {
            fallback = evidence.hint.description
          }

          if (this.acceptable(evidence.hint.description)) {
            return evidence.hint.description
          }
        }
      }
    }

    return fallback ?? ''
  }

  private acceptable = (description: string): boolean => {
    if (DemonstrativePattern.test(description) && description.length <= DemonstrativeThreshold) {
      return false
    }

    if (description.length <= ShortThreshold && !PredicatePattern.test(description)) {
      return false
    }

    return true
  }
}

export { WeightScorer }
