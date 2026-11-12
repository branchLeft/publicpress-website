import { existsSync, readFileSync } from 'node:fs';

import { expect } from '@playwright/test';

/** Where the stubbed mailer appends the messages (see playwright.config.ts). */
const OUTBOX = 'test-results/outbox.jsonl';

export type StubbedMessage = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
};

function outbox(): StubbedMessage[] {
  if (!existsSync(OUTBOX)) return [];
  return readFileSync(OUTBOX, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line) as StubbedMessage);
}

/** Every message sent to `email`, as the stub recorded it. */
export function messagesFor(email: string): StubbedMessage[] {
  return outbox().filter((message) => message.replyTo === email);
}

/** Waits for exactly one message from `email` and returns it. */
export async function expectOneMessageFor(email: string): Promise<StubbedMessage> {
  await expect.poll(() => messagesFor(email).length).toBe(1);
  const [message] = messagesFor(email);
  if (message === undefined) throw new Error('no message recorded');
  return message;
}

let counter = 0;

/** A unique address, so parallel tests find their own message. */
export function uniqueEmail(): string {
  counter += 1;
  return `reader-${process.pid}-${Date.now()}-${counter}@example.com`;
}

/** A unique client address, so parallel tests do not share a rate-limit bucket. */
export function uniqueIp(): string {
  counter += 1;
  return `10.${process.pid % 250}.${Math.floor(counter / 250) % 250}.${(counter % 250) + 1}`;
}

/** The minimum time the form must have been on the page before it may be posted. */
export const MIN_WAIT_MS = 1700;
