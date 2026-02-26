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
import { WeightScorer } from '../pipes/scorers/weight-scorer.js'
import { Pipeline } from './pipeline.js'

class MarkdownToHtmlPipeline extends Pipeline {
  constructor() {
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
      new WeightScorer(),
      new HtmlPublisher(new MarkdownTranscriber()),
    )
  }
}

export { MarkdownToHtmlPipeline }
