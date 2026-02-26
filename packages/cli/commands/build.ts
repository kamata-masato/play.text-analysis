import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { OllamaInference } from '@glossa/core/inferences/ollama-inference.js'
import { MarkdownToHtmlContextPipeline } from '@glossa/core/pipelines/markdown-to-html-context-pipeline.js'
import { MarkdownToHtmlPipeline } from '@glossa/core/pipelines/markdown-to-html-pipeline.js'
import type { Monitor, Pipeline } from '@glossa/core/pipelines/pipeline.js'
import type { Command } from 'commander'

type BuildOptions = {
  destination: string
  pipeline: string
  endpoint: string
  model: string
}

type BuildFactory = (options: BuildOptions, monitor: Monitor) => Pipeline

const BuildFactories = new Map<string, BuildFactory>([
  ['markdown-to-html', (_options, monitor) => new MarkdownToHtmlPipeline(monitor)],
  [
    'markdown-to-html-context',
    (options, monitor) =>
      new MarkdownToHtmlContextPipeline(
        new OllamaInference(options.endpoint, options.model),
        monitor,
      ),
  ],
])

const build = (command: Command): void => {
  command
    .command('build')
    .argument('<sources...>', 'source directories')
    .option('--destination <path>', 'output directory', 'distributions')
    .option('--pipeline <name>', 'pipeline to use', 'markdown-to-html')
    .option('--endpoint <url>', 'Ollama endpoint', 'http://localhost:11434')
    .option('--model <name>', 'Ollama model name', 'gemma3:12b')
    .action(async (sources: string[], options: BuildOptions) => {
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

      const factory = BuildFactories.get(options.pipeline)

      if (!factory) {
        console.error(`Unknown pipeline: ${options.pipeline}`)
        console.error(`Available pipelines: ${[...BuildFactories.keys()].join(', ')}`)

        process.exit(1)
      }

      const monitor: Monitor = (message) => {
        process.stderr.write(`${message}\n`)
      }

      const pipeline = factory(options, monitor)

      await pipeline.run(
        sources.map((source) => resolve(source)),
        resolve(options.destination),
      )
    })
}

export { build }
