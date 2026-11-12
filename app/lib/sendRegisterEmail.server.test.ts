import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createTransport, sendMail } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: { createTransport },
}));

import {
  REGISTER_SUBJECT,
  REGISTER_TO_ADDRESS,
  buildRegisterMessage,
  buildRegisterText,
  sendRegisterEmail,
  type RegisterSubmission,
} from './sendRegisterEmail.server';

const submission: RegisterSubmission = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  organisation: 'The Analytical Gazette',
  publishing: 'A weekly newsletter\non WordPress',
  page: '/ghost-hosting',
};

function setSmtpEnv() {
  vi.stubEnv('PUBLICPRESS_SMTP_HOST', 'smtp.example.test');
  vi.stubEnv('PUBLICPRESS_SMTP_PORT', '587');
  vi.stubEnv('PUBLICPRESS_SMTP_USER', 'submit@example.test');
  vi.stubEnv('PUBLICPRESS_SMTP_PASSWORD', 'a-secret-value');
}

beforeEach(() => {
  createTransport.mockReset();
  sendMail.mockReset();
  createTransport.mockReturnValue({ sendMail });
  sendMail.mockResolvedValue({});
  vi.stubEnv('PUBLICPRESS_MAIL_STUB_FILE', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the message', () => {
  it('goes to info@branchleft.co.uk with the agreed subject', () => {
    expect(REGISTER_TO_ADDRESS).toBe('info@branchleft.co.uk');
    expect(REGISTER_SUBJECT).toBe('Register interest in PublicPress');
    const message = buildRegisterMessage(submission, 'submit@example.test');
    expect(message.to).toBe('info@branchleft.co.uk');
    expect(message.subject).toBe('Register interest in PublicPress');
    expect(message.replyTo).toBe('ada@example.com');
    expect(message.from).toBe('PublicPress website <submit@example.test>');
  });

  it('lists the four fields, as the form labels them, and the page', () => {
    const text = buildRegisterText(submission);
    expect(text).toContain('Name: Ada Lovelace');
    expect(text).toContain('Email: ada@example.com');
    expect(text).toContain('Outlet or organisation: The Analytical Gazette');
    expect(text).toContain('What do you publish on today?\nA weekly newsletter\non WordPress');
    expect(text).toContain('Page: /ghost-hosting');
  });

  it('says so when an optional field was left empty', () => {
    const text = buildRegisterText({ ...submission, organisation: '', publishing: '', page: '/' });
    expect(text).toContain('Outlet or organisation: (not given)');
    expect(text).toContain('What do you publish on today?\n(not given)');
    expect(text).toContain('Page: /');
  });
});

describe('sending', () => {
  it('uses submission on 587 with STARTTLS required, and the env credentials', async () => {
    setSmtpEnv();
    await sendRegisterEmail(submission);

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.test',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: 'submit@example.test', pass: 'a-secret-value' },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'PublicPress website <submit@example.test>',
        to: 'info@branchleft.co.uk',
        replyTo: 'ada@example.com',
        subject: 'Register interest in PublicPress',
        text: expect.stringContaining('Name: Ada Lovelace'),
      })
    );
  });

  it('does not put the password in the message', async () => {
    setSmtpEnv();
    await sendRegisterEmail(submission);
    expect(JSON.stringify(sendMail.mock.calls)).not.toContain('a-secret-value');
  });

  it.each([
    'PUBLICPRESS_SMTP_HOST',
    'PUBLICPRESS_SMTP_PORT',
    'PUBLICPRESS_SMTP_USER',
    'PUBLICPRESS_SMTP_PASSWORD',
  ])('refuses to send when %s is not set, without naming a value', async (name) => {
    setSmtpEnv();
    vi.stubEnv(name, '');
    const failure = await sendRegisterEmail(submission).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain('must all be set');
    expect((failure as Error).message).not.toContain('a-secret-value');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('refuses a port that is not a number', async () => {
    setSmtpEnv();
    vi.stubEnv('PUBLICPRESS_SMTP_PORT', 'five-eight-seven');
    await expect(sendRegisterEmail(submission)).rejects.toThrow(TypeError);
  });

  it('passes a send failure on to the caller', async () => {
    setSmtpEnv();
    sendMail.mockRejectedValue(new Error('550 refused'));
    await expect(sendRegisterEmail(submission)).rejects.toThrow('550 refused');
  });
});

describe('test mode', () => {
  it('appends the message to the stub file and sends nothing', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'register-outbox-'));
    const file = join(directory, 'outbox.jsonl');
    vi.stubEnv('PUBLICPRESS_MAIL_STUB_FILE', file);

    await sendRegisterEmail(submission);
    await sendRegisterEmail({ ...submission, email: 'grace@example.com' });

    const lines = (await readFile(file, 'utf8')).trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      to: 'info@branchleft.co.uk',
      subject: 'Register interest in PublicPress',
      replyTo: 'ada@example.com',
    });
    expect(JSON.parse(lines[1] ?? '')).toMatchObject({ replyTo: 'grace@example.com' });
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
