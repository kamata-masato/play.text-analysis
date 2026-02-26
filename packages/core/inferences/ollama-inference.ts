import type { Inference } from './inference.js'

class OllamaInference implements Inference {
  constructor(
    private endpoint: string,
    private model: string,
  ) {}

  infer = async (system: string, prompt: string): Promise<string> => {
    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        format: 'json',
        stream: false,
        options: { temperature: 0 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`)
    }

    const body = (await response.json()) as { message?: { content?: string } }

    return body.message?.content ?? '[]'
  }

  dispose = async (): Promise<void> => {}
}

export { OllamaInference }
