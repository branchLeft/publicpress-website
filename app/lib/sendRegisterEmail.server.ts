import { appendFile } from 'node:fs/promises';

import nodemailer, { type Transporter } from 'nodemailer';

/** Which page the visitor registered from. */
export type RegisterPage = '/' | '/ghost-hosting';

export type RegisterSubmission = {
  readonly name: string;
  readonly email: string;
  readonly organisation: string;
  readonly publishing: string;
  readonly page: RegisterPage;
};

export const REGISTER_TO_ADDRESS = 'info@branchleft.co.uk';
export const REGISTER_SUBJECT = 'Register interest in PublicPress';

export type RegisterMessage = {
  readonly from: string;
  readonly to: string;
  readonly replyTo: string;
  readonly subject: string;
  readonly text: string;
};

function field(value: string): string {
  return value === '' ? '(not given)' : value;
}

/** The email body: the four fields as the form labels them, then the page it came from. */
export function buildRegisterText(submission: RegisterSubmission): string {
  return [
    'REGISTER INTEREST: PublicPress',
    '------------------------------',
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Outlet or organisation: ${field(submission.organisation)}`,
    '',
    'What do you publish on today?',
    field(submission.publishing),
    '',
    `Page: ${submission.page}`,
    '------------------------------',
    '(Reply-To is already set to the sender: hit reply.)',
  ].join('\n');
}

export function buildRegisterMessage(
  submission: RegisterSubmission,
  fromAddress: string
): RegisterMessage {
  return {
    from: `PublicPress website <${fromAddress}>`,
    to: REGISTER_TO_ADDRESS,
    replyTo: submission.email,
    subject: REGISTER_SUBJECT,
    text: buildRegisterText(submission),
  };
}

function getTransport(): { transport: Transporter; user: string } {
  const host = process.env.PUBLICPRESS_SMTP_HOST;
  const port = process.env.PUBLICPRESS_SMTP_PORT;
  const user = process.env.PUBLICPRESS_SMTP_USER;
  const pass = process.env.PUBLICPRESS_SMTP_PASSWORD;
  if (!host || !port || !user || !pass) {
    throw new Error(
      'PUBLICPRESS_SMTP_HOST, PUBLICPRESS_SMTP_PORT, PUBLICPRESS_SMTP_USER and PUBLICPRESS_SMTP_PASSWORD must all be set to send the register-interest email.'
    );
  }
  const portNumber = Number(port);
  if (!Number.isInteger(portNumber)) {
    throw new TypeError(`PUBLICPRESS_SMTP_PORT must be a number, got: ${port}`);
  }
  const transport = nodemailer.createTransport({
    host,
    port: portNumber,
    // Submission ports (587) negotiate encryption via STARTTLS rather than
    // starting TLS immediately, unlike 465's implicit TLS. requireTLS forces
    // that upgrade instead of silently falling back to plaintext.
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });
  return { transport, user };
}

/**
 * Test mode only. When `PUBLICPRESS_MAIL_STUB_FILE` is set, the message is
 * appended to that file as one JSON line and nothing is sent. Nothing in
 * `deploy/` sets it.
 */
async function writeToStub(path: string, message: RegisterMessage): Promise<void> {
  await appendFile(path, `${JSON.stringify(message)}\n`, 'utf8');
}

export async function sendRegisterEmail(submission: RegisterSubmission): Promise<void> {
  const stub = process.env.PUBLICPRESS_MAIL_STUB_FILE;
  if (stub) {
    await writeToStub(stub, buildRegisterMessage(submission, 'stub@publicpress.invalid'));
    return;
  }
  const { transport, user } = getTransport();
  // PUBLICPRESS_SMTP_USER doubles as the visible From identity. It must be a
  // submission-only account mapped to send-as, never the inbox's own login.
  await transport.sendMail(buildRegisterMessage(submission, user));
}
