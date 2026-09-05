import { Client } from '@upstash/qstash';

/**
 * Upstash QStash Client Singleton
 * Used for background jobs, asynchronous notifications (NOT-02),
 * and queue token event publishing.
 */
export const qstash = process.env.QSTASH_TOKEN
  ? new Client({
      token: process.env.QSTASH_TOKEN,
    })
  : null;

export async function publishEvent(destinationUrl: string, payload: any) {
  if (!qstash) {
    console.info('[QStash] Running in mock/local mode. Event queued locally:', payload);
    return { messageId: `mock-msg-${Date.now()}` };
  }

  return await qstash.publishJSON({
    url: destinationUrl,
    body: payload,
  });
}
