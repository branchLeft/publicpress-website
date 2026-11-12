import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./sendRegisterEmail.server', () => ({
  sendRegisterEmail: vi.fn(),
}));

import { sendRegisterEmail } from './sendRegisterEmail.server';
import {
  EMAIL_MAX_LENGTH,
  HONEYPOT_FIELD_NAME,
  NAME_MAX_LENGTH,
  ORGANISATION_MAX_LENGTH,
  PUBLISHING_MAX_LENGTH,
} from './register-fields';
import {
  MIN_SUBMIT_DELAY_MS,
  RATE_LIMIT_MAX_SUBMISSIONS,
  RATE_LIMIT_WINDOW_MS,
  isOwnOrigin,
  resetRateLimit,
  submitRegister,
} from './register.server';

const NOW = 1_800_000_000_000;
const RENDERED_LONG_AGO = String(NOW - MIN_SUBMIT_DELAY_MS - 5000);

type Overrides = Record<string, string>;

function formData(overrides: Overrides = {}): FormData {
  const fields: Record<string, string> = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    organisation: 'The Analytical Gazette',
    publishing: 'A weekly newsletter',
    page: '/',
    renderedAt: RENDERED_LONG_AGO,
    [HONEYPOT_FIELD_NAME]: '',
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function post(
  overrides: Overrides = {},
  headers: Record<string, string> = {},
  url = 'http://publicpress.test/'
): Request {
  return new Request(url, { method: 'POST', body: formData(overrides), headers });
}

/** What the action answered: React Router's `data()` wrapper, unpacked. */
async function answer(request: Request, now = NOW) {
  const result = (await submitRegister(request, now)) as unknown as {
    data: { ok: boolean; values?: Record<string, string> };
    init: { status?: number } | null;
  };
  return { status: result.init?.status ?? 200, body: result.data };
}

const mailer = vi.mocked(sendRegisterEmail);

beforeEach(() => {
  mailer.mockReset();
  mailer.mockResolvedValue(undefined);
  resetRateLimit();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('a valid submission', () => {
  it('sends the four fields and the page it came from, and answers ok', async () => {
    const { status, body } = await answer(post());
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mailer).toHaveBeenCalledTimes(1);
    expect(mailer).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      organisation: 'The Analytical Gazette',
      publishing: 'A weekly newsletter',
      page: '/',
    });
  });

  it('passes the Ghost hosting page through, and falls back to / for anything else', async () => {
    await answer(post({ page: '/ghost-hosting' }));
    await answer(post({ page: 'https://evil.example/' }));
    expect(mailer).toHaveBeenNthCalledWith(1, expect.objectContaining({ page: '/ghost-hosting' }));
    expect(mailer).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: '/' }));
  });

  it('trims the fields', async () => {
    await answer(post({ name: '  Ada  ', organisation: '  ', publishing: '\n hi \n' }));
    expect(mailer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ada', organisation: '', publishing: 'hi' })
    );
  });

  it('needs only a name and an email', async () => {
    const { status } = await answer(post({ organisation: '', publishing: '' }));
    expect(status).toBe(200);
    expect(mailer).toHaveBeenCalledTimes(1);
  });

  it('keeps line breaks in the free-text field', async () => {
    await answer(post({ publishing: 'one\ntwo' }));
    expect(mailer).toHaveBeenCalledWith(expect.objectContaining({ publishing: 'one\ntwo' }));
  });
});

describe('bot signals get a pretend success and no email', () => {
  it('a filled honeypot', async () => {
    const { status, body } = await answer(post({ [HONEYPOT_FIELD_NAME]: 'http://spam.example' }));
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mailer).not.toHaveBeenCalled();
  });

  it('a post sooner than the minimum time after the page rendered', async () => {
    const { body } = await answer(post({ renderedAt: String(NOW - MIN_SUBMIT_DELAY_MS + 1) }));
    expect(body).toEqual({ ok: true });
    expect(mailer).not.toHaveBeenCalled();
  });

  it('a post at exactly the minimum time is let through', async () => {
    await answer(post({ renderedAt: String(NOW - MIN_SUBMIT_DELAY_MS) }));
    expect(mailer).toHaveBeenCalledTimes(1);
  });

  it('a missing, non-numeric or future renderedAt', async () => {
    for (const renderedAt of ['', ' ', 'soon', '1e3', '-5', String(NOW + 60_000)]) {
      resetRateLimit();
      const { body } = await answer(post({ renderedAt }));
      expect(body, `renderedAt ${JSON.stringify(renderedAt)}`).toEqual({ ok: true });
    }
    expect(mailer).not.toHaveBeenCalled();
  });

  it('a bot is not told which signal caught it: the answer is the same as a real success', async () => {
    const real = await answer(post());
    const bot = await answer(post({ [HONEYPOT_FIELD_NAME]: 'x' }));
    expect(bot).toEqual(real);
  });
});

describe('validation refuses with 400 and hands the typed values back', () => {
  it.each<[string, Overrides]>([
    ['a missing name', { name: '' }],
    ['a blank name', { name: '   ' }],
    ['a name over the cap', { name: 'x'.repeat(NAME_MAX_LENGTH + 1) }],
    ['a name with a control character', { name: 'Ada\u0000' }],
    ['a name with a line break', { name: 'Ada\r\nBcc: someone@example.com' }],
    ['a missing email', { email: '' }],
    ['an email without an @', { email: 'ada.example.com' }],
    ['an email without a dot after the @', { email: 'ada@localhost' }],
    ['an email with a space', { email: 'ada lovelace@example.com' }],
    ['an email over the cap', { email: `${'a'.repeat(EMAIL_MAX_LENGTH)}@example.com` }],
    ['an organisation over the cap', { organisation: 'x'.repeat(ORGANISATION_MAX_LENGTH + 1) }],
    ['an organisation with a line break', { organisation: 'A\nB' }],
    ['a free-text field over the cap', { publishing: 'x'.repeat(PUBLISHING_MAX_LENGTH + 1) }],
  ])('%s', async (_label, overrides) => {
    const { status, body } = await answer(post(overrides));
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.values).toEqual(
      expect.objectContaining({ email: overrides.email ?? 'ada@example.com' })
    );
    expect(mailer).not.toHaveBeenCalled();
  });

  it('accepts a field exactly at its cap', async () => {
    const { status } = await answer(
      post({
        name: 'n'.repeat(NAME_MAX_LENGTH),
        organisation: 'o'.repeat(ORGANISATION_MAX_LENGTH),
        publishing: 'p'.repeat(PUBLISHING_MAX_LENGTH),
      })
    );
    expect(status).toBe(200);
  });

  it('refuses a body that is not a form at all', async () => {
    const request = new Request('http://publicpress.test/', {
      method: 'POST',
      body: 'not a form',
      headers: { 'content-type': 'multipart/form-data; boundary=missing' },
    });
    const { status, body } = await answer(request);
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(mailer).not.toHaveBeenCalled();
  });
});

describe('the Origin check', () => {
  const own = 'http://publicpress.test';

  it('refuses a foreign Origin with 403 and sends nothing', async () => {
    const { status, body } = await answer(post({}, { origin: 'https://evil.example' }));
    expect(status).toBe(403);
    expect(body.ok).toBe(false);
    expect(mailer).not.toHaveBeenCalled();
  });

  it('refuses a look-alike host and Origin: null', () => {
    for (const origin of ['https://publicpress.test.evil.example', 'null', 'not a url']) {
      expect(isOwnOrigin(post({}, { origin }))).toBe(false);
    }
  });

  it("accepts the request URL's own host, whatever the scheme (the edge terminates TLS)", () => {
    expect(isOwnOrigin(post({}, { origin: own }))).toBe(true);
    expect(isOwnOrigin(post({}, { origin: 'https://publicpress.test' }))).toBe(true);
    expect(isOwnOrigin(post({}, { origin: 'https://PUBLICPRESS.test' }))).toBe(true);
  });

  it("accepts the site's canonical origin even when the request URL carries another host", () => {
    const request = post({}, { origin: 'https://publicpress.co.uk' }, 'http://10.20.1.100:8085/');
    expect(isOwnOrigin(request)).toBe(true);
  });

  it('accepts a request with no Origin header', () => {
    expect(isOwnOrigin(post())).toBe(true);
  });

  it('refuses before counting against the rate limit', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS + 3; i += 1) {
      await answer(post({}, { origin: 'https://evil.example', 'x-forwarded-for': '203.0.113.9' }));
    }
    const { status } = await answer(post({}, { 'x-forwarded-for': '203.0.113.9' }));
    expect(status).toBe(200);
  });
});

describe('the rate limit', () => {
  const from = (ip: string) => post({}, { 'x-forwarded-for': ip });

  it(`allows ${RATE_LIMIT_MAX_SUBMISSIONS} and refuses the next with 429`, async () => {
    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS; i += 1) {
      expect((await answer(from('198.51.100.1'), NOW + i)).status).toBe(200);
    }
    const refused = await answer(from('198.51.100.1'), NOW + 10);
    expect(refused.status).toBe(429);
    expect(refused.body.ok).toBe(false);
    expect(mailer).toHaveBeenCalledTimes(RATE_LIMIT_MAX_SUBMISSIONS);
  });

  it('counts bot posts too', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS; i += 1) {
      await answer(post({ [HONEYPOT_FIELD_NAME]: 'x' }, { 'x-forwarded-for': '198.51.100.2' }));
    }
    expect((await answer(from('198.51.100.2'))).status).toBe(429);
  });

  it('is per address', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS; i += 1) await answer(from('198.51.100.3'));
    expect((await answer(from('198.51.100.3'))).status).toBe(429);
    expect((await answer(from('198.51.100.4'))).status).toBe(200);
  });

  it('takes the first address in X-Forwarded-For', async () => {
    const chain = (client: string) => post({}, { 'x-forwarded-for': `${client}, 10.20.1.1` });
    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS; i += 1) await answer(chain('198.51.100.5'));
    expect((await answer(chain('198.51.100.5'))).status).toBe(429);
    expect((await answer(chain('198.51.100.6'))).status).toBe(200);
  });

  it('lets an address back in once the window has passed', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS; i += 1) await answer(from('198.51.100.7'), NOW);
    expect((await answer(from('198.51.100.7'), NOW + 1000)).status).toBe(429);
    expect((await answer(from('198.51.100.7'), NOW + RATE_LIMIT_WINDOW_MS + 1)).status).toBe(200);
  });

  it('has the documented limit: 5 in 10 minutes', () => {
    expect(RATE_LIMIT_MAX_SUBMISSIONS).toBe(5);
    expect(RATE_LIMIT_WINDOW_MS).toBe(600_000);
  });

  it('prunes stale addresses so the table does not grow without bound', async () => {
    for (let i = 0; i < 600; i += 1) await answer(from(`192.0.2.${i % 250}.${i}`), NOW);
    const later = NOW + RATE_LIMIT_WINDOW_MS + 5;
    expect((await answer(from('198.51.100.8'), later)).status).toBe(200);
  });
});

describe('when the send fails', () => {
  it('answers 500 with the typed values, and logs the failure without any credential', async () => {
    vi.stubEnv('PUBLICPRESS_SMTP_PASSWORD', 'hunter2-secret');
    mailer.mockRejectedValue(
      Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' })
    );

    const { status, body } = await answer(post());
    expect(status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.values).toEqual(expect.objectContaining({ name: 'Ada Lovelace' }));

    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain('ECONNREFUSED');
    expect(logged).toContain('connection refused');
    expect(logged).not.toContain('hunter2-secret');
    vi.unstubAllEnvs();
  });

  it('survives a thrown value that is not an Error', async () => {
    mailer.mockRejectedValue('boom');
    expect((await answer(post())).status).toBe(500);
  });
});
