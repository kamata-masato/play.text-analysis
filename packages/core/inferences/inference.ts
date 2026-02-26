type Inference = {
  infer: (system: string, prompt: string) => Promise<string>
  dispose: () => Promise<void>
}

export type { Inference }
