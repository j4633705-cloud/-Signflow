import { createHmac } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { fetchWithTimeout } from '../../utils/timeout';
import { assertNotPrivateUrl } from './assert-webhook-url';

const WEBHOOK_TIMEOUT_MS = 10_000;

const WEBHOOK_SIGNATURE_HEADER = 'X-signflow-Signature';
const WEBHOOK_SECRET_HEADER = 'X-signflow-Secret';

const SIGNATURE_VERSION = 'v1';

export type WebhookCallResult = {
  success: boolean;
  responseCode: number;
  responseBody: Prisma.InputJsonValue | Prisma.JsonNullValueInput;
  responseHeaders: Record<string, string>;
};

const parseBody = (text: string): Prisma.InputJsonValue => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const signPayload = (body: string, secret: string): string => {
  const hmac = createHmac('sha256', secret);
  hmac.update(body, 'utf-8');
  return `${SIGNATURE_VERSION},${hmac.digest('hex')}`;
};

export const executeWebhookCall = async (options: {
  url: string;
  body: unknown;
  secret: string | null;
}): Promise<WebhookCallResult> => {
  const { url, body, secret } = options;

  try {
    await assertNotPrivateUrl(url);

    const bodyString = JSON.stringify(body);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    headers[WEBHOOK_SECRET_HEADER] = secret ?? '';

    if (secret) {
      headers[WEBHOOK_SIGNATURE_HEADER] = signPayload(bodyString, secret);
    }

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      body: bodyString,
      redirect: 'manual',
      timeoutMs: WEBHOOK_TIMEOUT_MS,
      headers,
    });

    const text = await response.text();

    return {
      success: response.ok,
      responseCode: response.status,
      responseBody: parseBody(text),
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  } catch (err) {
    return {
      success: false,
      responseCode: 0,
      responseBody: err instanceof Error ? err.message : 'Unknown error',
      responseHeaders: {},
    };
  }
};
