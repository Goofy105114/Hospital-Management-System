import { Client } from "@upstash/qstash";

const isQStashConfigured = Boolean(process.env.QSTASH_TOKEN);

export const qstash = isQStashConfigured
  ? new Client({
      token: process.env.QSTASH_TOKEN!,
    })
  : null;

export async function publishBackgroundTask(
  endpointUrl: string,
  body: Record<string, unknown>,
  delaySeconds?: number
): Promise<boolean> {
  if (!qstash) {
    // If QStash is not configured, execute asynchronously via fetch in background or simulate
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[QSTASH LOCAL SIMULATION] Published task to ${endpointUrl} (delay: ${delaySeconds || 0}s)`
      );
    }
    return true;
  }

  try {
    await qstash.publishJSON({
      url: endpointUrl,
      body,
      delay: delaySeconds,
    });
    return true;
  } catch (err) {
    console.error("[QSTASH PUBLISH ERROR]", err);
    return false;
  }
}
