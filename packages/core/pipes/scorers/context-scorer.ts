import type { Inference } from '../../inferences/inference.js'
import type { Concept, Prospect } from '../../models/concept.js'
import type { Monitor } from '../../pipelines/pipeline.js'
import type { Scorer } from './scorer.js'
import { WeightScorer } from './weight-scorer.js'

const BatchSize = 5

const ContextRadius = 100

const SystemPrompt = `You are a glossary curator for technical documentation written in Japanese (with English technical terms).

You will receive a list of candidate glossary terms, each with:
- name: the candidate term
- description: an existing description extracted by heuristics (may be empty)
- contexts: text passages where the term appears
- rules: which extraction rules detected it

Your tasks:
1. Determine if each candidate is a genuine domain-specific term (accepted: true) or a false positive (accepted: false)
2. For accepted terms, provide a concise description (1-2 sentences in Japanese)

A genuine glossary term is a noun or noun phrase that would appear as an entry in a professional technical glossary or textbook index. When in doubt, reject.

Reject candidates that are:
- Common Japanese words unless they are established technical terms whose meaning differs from everyday usage (e.g. "読み取り" as a file permission is accepted because "read permission" is a distinct technical concept; "作成" as a generic action is rejected because its meaning is the same as everyday "create")
- Incomplete sentence fragments that are not standalone terms (e.g. "CTログは追記専用", "値が全部SomeならSome")
- Vague descriptive phrases (e.g. "基本的な使い方", "次のようなエラー", "導入説明")
- Phrases where a particle (を, が) connects a noun to a verb, forming a clause rather than a term (e.g. "ActionをDispatch", "フィードを吐く", "環境変数をハッシュ")
- Descriptive phrases with における (e.g. "ESLintにおけるルール", "対応するレコードを表すオブジェクト")
- Book titles, document titles, or memo page names (e.g. "Scala逆引きレシピ", "Scalaメモ")
- Section numbers or version prefixes attached to terms (e.g. "4.1 Scalatra")
- Short labels without clear technical meaning (e.g. NOTE, HH, OR)
- File paths or URL-like strings (e.g. /分岐網羅)

Here are examples of correct judgments:

ACCEPT examples:
- "TCP" → accepted: true (well-known protocol)
- "ガベージコレクション" → accepted: true (technical concept)
- "読み取り" → accepted: true (file permission concept, meaning differs from everyday usage)
- "書き込み" → accepted: true (file permission concept, meaning differs from everyday usage)

REJECT examples:
- "一覧" → rejected (generic word, same meaning as everyday usage)
- "作成" → rejected (generic action, same meaning as everyday usage)
- "失敗" → rejected (generic word, same meaning as everyday usage)
- "CTログは追記専用" → rejected (sentence fragment)
- "ActionをDispatch" → rejected (verb phrase with particle)
- "ESLintにおけるルール" → rejected (descriptive phrase with における)
- "NOTE" → rejected (label, not a technical term)
- "Scala逆引きレシピ" → rejected (book title)
- "4.1 Scalatra" → rejected (section number prefix)
- "/分岐網羅" → rejected (slash prefix from list context)
- "基本的な使い方" → rejected (generic phrase)

For accepted terms with a good existing description, keep it unchanged.
For accepted terms with an empty or poor description, generate a concise description based on the contexts.

Respond with a JSON object containing a "results" key with an array of judgments:
{"results": [{"name": "...", "accepted": true, "description": "..."}, ...]}`

type Judgment = {
  name: string
  accepted: boolean
  description: string
}

class ContextScorer implements Scorer {
  private heuristic = new WeightScorer()

  constructor(private inference: Inference) {}

  score = async (prospects: Prospect[], monitor?: Monitor): Promise<Concept[]> => {
    const concepts = this.heuristic.score(prospects)

    const batches: Concept[][] = []
    for (let offset = 0; offset < concepts.length; offset += BatchSize) {
      batches.push(concepts.slice(offset, offset + BatchSize))
    }

    const judgments = new Map<string, Judgment>()
    let index = 0
    for (const batch of batches) {
      index++
      monitor?.(`Scoring concepts [${index}/${batches.length}]...`)
      const results = await this.judge(batch)
      for (const judgment of results) {
        judgments.set(judgment.name, judgment)
      }
    }

    return this.refine(concepts, judgments)
  }

  private judge = async (concepts: Concept[]): Promise<Judgment[]> => {
    const payload = concepts.map((concept) => ({
      name: concept.name,
      description: concept.description,
      contexts: this.summarize(concept),
      rules: [...new Set(concept.evidences.map((evidence) => evidence.rule))],
    }))

    try {
      const content = await this.inference.infer(SystemPrompt, JSON.stringify(payload))

      return this.parse(content, concepts)
    } catch {
      console.warn('Inference failed, falling back to heuristic results')

      return concepts.map((concept) => ({
        name: concept.name,
        accepted: true,
        description: concept.description,
      }))
    }
  }

  private parse = (content: string, concepts: Concept[]): Judgment[] => {
    try {
      const parsed = JSON.parse(content) as unknown

      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (entry): entry is Judgment =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof entry.name === 'string' &&
              typeof entry.accepted === 'boolean',
          )
          .map((entry) => ({
            name: entry.name,
            accepted: entry.accepted,
            description: typeof entry.description === 'string' ? entry.description : '',
          }))
      }

      if (typeof parsed === 'object' && parsed !== null) {
        const wrapped = Object.values(parsed)
        if (Array.isArray(wrapped[0])) {
          return this.parse(JSON.stringify(wrapped[0]), concepts)
        }
      }

      return concepts.map((concept) => ({
        name: concept.name,
        accepted: true,
        description: concept.description,
      }))
    } catch {
      return concepts.map((concept) => ({
        name: concept.name,
        accepted: true,
        description: concept.description,
      }))
    }
  }

  private summarize = (concept: Concept): string[] => {
    const seen = new Set<string>()
    const contexts: string[] = []

    for (const evidence of concept.evidences) {
      const key = `${evidence.note.source}:${evidence.hint.line}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      const heading = evidence.note.headings?.length
        ? evidence.note.headings.map((heading) => heading.text).join(' > ')
        : undefined

      let snippet: string
      if (evidence.hint.span) {
        const start = Math.max(0, evidence.hint.span.offset - ContextRadius)
        const end = Math.min(
          evidence.note.text.length,
          evidence.hint.span.offset + evidence.hint.span.text.length + ContextRadius,
        )
        snippet = evidence.note.text.slice(start, end)
      } else {
        snippet = evidence.note.text.slice(0, ContextRadius * 2)
      }

      const prefix = heading ? `[${heading}] ` : ''
      contexts.push(`${prefix}${snippet}`)

      if (contexts.length >= 3) {
        break
      }
    }

    return contexts
  }

  private refine = (concepts: Concept[], judgments: Map<string, Judgment>): Concept[] => {
    return concepts
      .filter((concept) => {
        const judgment = judgments.get(concept.name)

        return judgment === undefined || judgment.accepted
      })
      .map((concept) => {
        const judgment = judgments.get(concept.name)

        if (judgment && judgment.description.length > 0) {
          return { ...concept, description: judgment.description }
        }

        return concept
      })
  }
}

export { ContextScorer }
