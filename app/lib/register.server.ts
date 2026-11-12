import { data } from 'react-router';

import { SITE_ORIGIN } from './pages';
import {
  EMAIL_MAX_LENGTH,
  EMPTY_VALUES,
  HONEYPOT_FIELD_NAME,
  NAME_MAX_LENGTH,
  ORGANISATION_MAX_LENGTH,
  PUBLISHING_MAX_LENGTH,
  type RegisterResult,
  type RegisterValues,
} from './register-fields';
import { sendRegisterEmail, type RegisterPage } from './sendRegisterEmail.server';

/**
 * The register form's action: abuse controls first (own-origin check, per-IP
 * rate limit, honeypot, minimum time on the page), then validation, then the
 * send. Refusals answer with an HTTP status and `ok: false`; a bot gets a
 * pretend success and no email.
 */

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,24}$/;
// A single-line field may carry no control character: it ends up in the mail.
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/;

// Minimum time between the page rendering (stamped by the loader as
// `renderedAt`) and the form posting. A visitor needs at least this long to
// read the form and type two fields; a script that posts straight after
// fetching the page does not.
export const MIN_SUBMIT_DELAY_MS = 1500;

// Per-IP submission rate limit. Deliberately simple and in-memory (a Map of
// timestamps, pruned lazily) rather than a new infrastructure dependency. The
// limit is per server instance: the site runs as one container.
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT_MAX_SUBMISSIONS = 5;

const submissionsByIp = new Map<string, number[]>();

/** Forget every recorded submission. For tests. */
export function resetRateLimit(): void {
  submissionsByIp.clear();
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Records a submission attempt for `ip` and reports whether it is over the
 * limit. Also prunes stale IPs so the map does not grow without bound.
 */
function isRateLimited(ip: string, now: number): boolean {
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  submissionsByIp.set(ip, recent);

  if (submissionsByIp.size > 500) {
    for (const [key, timestamps] of submissionsByIp) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
        submissionsByIp.delete(key);
      }
    }
  }

  return recent.length > RATE_LIMIT_MAX_SUBMISSIONS;
}

/**
 * A POST whose `Origin` header is present must name this site. The header is
 * absent on some same-origin requests and on non-browser clients; those pass
 * here and meet the other controls. `Origin: null` (sandboxed frames, some
 * privacy modes) is present and is not the site, so it is refused.
 *
 * The edge terminates TLS and forwards plain HTTP, so the request URL's scheme
 * is not the browser's. The host is compared, plus the site's canonical origin.
 */
export function isOwnOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin === null) return true;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  return (
    parsed.host.toLowerCase() === new URL(request.url).host.toLowerCase() ||
    parsed.origin === SITE_ORIGIN
  );
}

/** A form field as text, with the CRLF line breaks a browser sends turned into LF. */
function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.replaceAll('\r\n', '\n') : '';
}

/** The page's render time in ms, or NaN when the field is absent or not a plain number. */
function renderedAtOf(formData: FormData): number {
  const raw = formString(formData, 'renderedAt');
  return /^\d{1,16}$/.test(raw) ? Number(raw) : Number.NaN;
}

function pageOf(formData: FormData): RegisterPage {
  return formString(formData, 'page') === '/ghost-hosting' ? '/ghost-hosting' : '/';
}

function isValid(values: RegisterValues): boolean {
  const { name, email, organisation, publishing } = values;
  return (
    name !== '' &&
    name.length <= NAME_MAX_LENGTH &&
    !CONTROL_CHARACTER.test(name) &&
    email.length <= EMAIL_MAX_LENGTH &&
    EMAIL_PATTERN.test(email) &&
    organisation.length <= ORGANISATION_MAX_LENGTH &&
    !CONTROL_CHARACTER.test(organisation) &&
    publishing.length <= PUBLISHING_MAX_LENGTH
  );
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return `${error.name}${typeof code === 'string' ? ` ${code}` : ''}: ${error.message}`;
  }
  return 'unknown error';
}

function refuse(status: number, values: RegisterValues = EMPTY_VALUES) {
  return data<RegisterResult>({ ok: false, values }, { status });
}

export async function submitRegister(request: Request, now: number = Date.now()) {
  if (!isOwnOrigin(request)) return refuse(403);

  if (isRateLimited(getClientIp(request), now)) return refuse(429);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return refuse(400);
  }

  const values: RegisterValues = {
    name: formString(formData, 'name').trim(),
    email: formString(formData, 'email').trim(),
    organisation: formString(formData, 'organisation').trim(),
    publishing: formString(formData, 'publishing').trim(),
  };
  const honeypot = formString(formData, HONEYPOT_FIELD_NAME);
  const renderedAt = renderedAtOf(formData);

  // Bot signals: the honeypot got filled, or the form posted faster than a
  // person could fill it. Pretend success either way, so a scripted client
  // gets no signal to adapt to.
  if (honeypot !== '' || !Number.isFinite(renderedAt) || now - renderedAt < MIN_SUBMIT_DELAY_MS) {
    return data<RegisterResult>({ ok: true });
  }

  if (!isValid(values)) return refuse(400, values);

  try {
    await sendRegisterEmail({ ...values, page: pageOf(formData) });
  } catch (error) {
    // The send already failed, and the visitor's only path back is the
    // failure message returned here. Only the error's name, code and message
    // are logged, never the transport options that carry the credential.
    console.error('Failed to send the register-interest email:', describeError(error));
    return refuse(500, values);
  }

  return data<RegisterResult>({ ok: true });
}
