import type { Inference } from '../inferences/inference.js'
import { BuiltinRules } from '../models/rule.js'
import { NameBundler } from '../pipes/bundlers/name-bundler.js'
import { AbbreviationAfterColonFinder } from '../pipes/finders/abbreviation-after-colon-finder.js'
import { AliasInParenthesesFinder } from '../pipes/finders/alias-in-parentheses-finder.js'
import { BoldTextFinder } from '../pipes/finders/bold-text-finder.js'
import { HaInBodyFinder } from '../pipes/finders/ha-in-body-finder.js'
import { JapaneseSupplementInParenthesesFinder } from '../pipes/finders/japanese-supplement-in-parentheses-finder.js'
import { TohaInBodyFinder } from '../pipes/finders/toha-in-body-finder.js'
import { TohaInHeadingFinder } from '../pipes/finders/toha-in-heading-finder.js'
import { MarkdownParser } from '../pipes/parsers/markdown-parser.js'
import { HtmlPublisher } from '../pipes/publishers/html-publisher.js'
import { MarkdownTranscriber } from '../pipes/publishers/transcribers/markdown-transcriber.js'
import { ContextScorer } from '../pipes/scorers/context-scorer.js'
import { type Monitor, Pipeline } from './pipeline.js'

class MarkdownToHtmlContextPipeline extends Pipeline {
  constructor(inference: Inference, monitor?: Monitor) {
    super(
      new MarkdownParser(),
      {
        [BuiltinRules.BoldText]: new BoldTextFinder(),
        [BuiltinRules.TohaInBody]: new TohaInBodyFinder(),
        [BuiltinRules.TohaInHeading]: new TohaInHeadingFinder(),
        [BuiltinRules.HaInBody]: new HaInBodyFinder(),
        [BuiltinRules.AliasInParentheses]: new AliasInParenthesesFinder(),
        [BuiltinRules.JapaneseSupplementInParentheses]: new JapaneseSupplementInParenthesesFinder(),
        [BuiltinRules.AbbreviationAfterColon]: new AbbreviationAfterColonFinder(),
      },
      new NameBundler(),
      new ContextScorer(inference),
      new HtmlPublisher(new MarkdownTranscriber()),
      monitor,
    )
  }
}

export { MarkdownToHtmlContextPipeline }
