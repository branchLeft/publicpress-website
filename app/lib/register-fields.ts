/**
 * What the register form and its action both need: the field names, the length
 * caps and the shape of the action's answer. Safe to import from the browser.
 */

// Hard caps so a submission cannot carry an arbitrarily large body into the
// SMTP send. 254 is the practical maximum length of a valid email address.
export const NAME_MAX_LENGTH = 200;
export const EMAIL_MAX_LENGTH = 254;
export const ORGANISATION_MAX_LENGTH = 200;
export const PUBLISHING_MAX_LENGTH = 2000;

// Honeypot: a field real visitors never see or reach (aria-hidden, out of the
// tab order, off-screen). Its name is not one a browser's autofill fills (this
// is not `company` or `organization`, which the real "Outlet or organisation"
// field sits beside), and neither it nor its label says "honeypot", a common
// bot-side blocklist keyword.
export const HONEYPOT_FIELD_NAME = 'fax';

export type RegisterValues = {
  readonly name: string;
  readonly email: string;
  readonly organisation: string;
  readonly publishing: string;
};

export const EMPTY_VALUES: RegisterValues = {
  name: '',
  email: '',
  organisation: '',
  publishing: '',
};

/**
 * The action's answer. On `ok: false` the values the visitor typed come back so
 * a form posted without JavaScript is not emptied by a refusal.
 */
export type RegisterResult =
  { readonly ok: true } | { readonly ok: false; readonly values: RegisterValues };
