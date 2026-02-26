import { afterEach, describe, expect, it, vi } from 'vitest'
import { OllamaInference } from '../../inferences/ollama-inference.js'

const Endpoint = 'http://localhost:19999'
const Model = 'dummy-model'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OllamaInference', () => {
  describe('infer - 正常応答の処理', () => {
    it('応答メッセージの content を返すこと', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ message: { content: '{"results": []}' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      const inference = new OllamaInference(Endpoint, Model)
      const inferred = await inference.infer('system prompt', 'user prompt')
      expect(inferred).toBe('{"results": []}')
    })

    it('content が存在しない場合に空配列文字列を返すこと', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ message: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      const inference = new OllamaInference(Endpoint, Model)
      const inferred = await inference.infer('system prompt', 'user prompt')
      expect(inferred).toBe('[]')
    })
  })

  describe('infer - エラーの伝搬', () => {
    it('HTTP エラーステータスで例外を throw すること', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }))
      const inference = new OllamaInference(Endpoint, Model)
      await expect(inference.infer('system', 'prompt')).rejects.toThrow('Ollama returned 500')
    })

    it('ネットワークエラーで例外を throw すること', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'))
      const inference = new OllamaInference(Endpoint, Model)
      await expect(inference.infer('system', 'prompt')).rejects.toThrow('ECONNREFUSED')
    })
  })
})
