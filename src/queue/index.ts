import { valkey } from './valkey.js';

const QUEUE_KEY = 'webhook:events';

export async function enqueueEvent(payload: unknown): Promise<void> {
  await valkey.lpush(QUEUE_KEY, JSON.stringify(payload));
}

export async function dequeueEvent(): Promise<unknown | null> {
  const result = await valkey.brpop(QUEUE_KEY, 5);
  if (!result) return null;
  return JSON.parse(result[1]);
}
