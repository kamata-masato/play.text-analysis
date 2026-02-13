import type { Root as HastRoot } from 'hast'

type Transcriber = {
  transcribe(raw: string): Promise<HastRoot>
}

export type { Transcriber }
