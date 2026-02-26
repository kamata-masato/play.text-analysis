import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { MarkdownToHtmlPipeline } from '@glossa/core/pipelines/markdown-to-html-pipeline.js'
import type { Pipeline } from '@glossa/core/pipelines/pipeline.js'
import type { Command } from 'commander'

const factories = new Map<string, () => Pipeline>([
  ['markdown-to-html', () => new MarkdownToHtmlPipeline()],
])

const build = (command: Command): void => {
  command
    .command('build')
    .argument('<sources...>', 'source directories')
    .option('--destination <path>', 'output directory', 'distributions')
    .option('--pipeline <name>', 'pipeline to use', 'markdown-to-html')
    .action(async (sources: string[], options: { destination: string; pipeline: string }) => {
      for (const source of sources) {
        const resolved = resolve(source)

        try {
          const status = await stat(resolved)

          if (!status.isDirectory()) {
            console.error(`Not a directory: ${source}`)
            process.exit(1)
          }
        } catch {
          console.error(`Directory not found: ${source}`)
          process.exit(1)
        }
      }

      const factory = factories.get(options.pipeline)

      if (!factory) {
        const available = [...factories.keys()].join(', ')
        console.error(`Unknown pipeline: ${options.pipeline}`)
        console.error(`Available pipelines: ${available}`)
        process.exit(1)
      }

      const pipeline = factory()

      await pipeline.run(
        sources.map((source) => resolve(source)),
        resolve(options.destination),
      )
    })
}

export { build }
