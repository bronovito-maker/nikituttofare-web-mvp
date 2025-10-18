// lib/ai-shim.ts
export type OpenAICompletionStream = AsyncIterable<{
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
  }>;
}>;

/**
 * Adatta lo stream restituito dall'SDK OpenAI in un ReadableStream di testo.
 */
export function OpenAIStream(completion: OpenAICompletionStream): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const part of completion) {
          const token = part?.choices?.[0]?.delta?.content;
          if (token) {
            controller.enqueue(encoder.encode(token));
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Response helper compatibile con l'API del pacchetto `ai`.
 */
export class StreamingTextResponse extends Response {
  constructor(stream: ReadableStream<Uint8Array>, init?: ResponseInit) {
    super(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(init?.headers || {}),
      },
      status: init?.status,
      statusText: init?.statusText,
    });
  }
}
