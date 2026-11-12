import * as React from 'react';
import { Form, useActionData, useLocation, useNavigation } from 'react-router';

import { useSite } from '~/components/SiteContext';
import { REGISTER_FAILURE_MESSAGE, REGISTER_SUCCESS_MESSAGE } from '~/content/register-messages';
import {
  EMAIL_MAX_LENGTH,
  EMPTY_VALUES,
  HONEYPOT_FIELD_NAME,
  NAME_MAX_LENGTH,
  ORGANISATION_MAX_LENGTH,
  PUBLISHING_MAX_LENGTH,
  type RegisterResult,
} from '~/lib/register-fields';

/**
 * The register-interest form: a plain `<form method="post">` that works with
 * scripting off (the browser posts to this page's own route action and the
 * answer is the page again), and that React Router upgrades to a fetch when
 * scripting is on. Either way a successful submit replaces the form with the
 * success message, in place, at `#register`.
 */
export function RegisterForm(): React.JSX.Element {
  const { renderedAt, page } = useSite();
  const actionData = useActionData<RegisterResult>();
  const navigation = useNavigation();
  const location = useLocation();
  const submitting = navigation.state === 'submitting';

  // Opening a pop-up afterwards navigates, which clears the action's data; the
  // success message must not give way to an empty form again.
  const [registered, setRegistered] = React.useState(false);
  if (actionData?.ok === true && !registered) setRegistered(true);

  const registeredNow = registered || actionData?.ok === true;
  React.useEffect(() => {
    if (registeredNow) document.getElementById('register')?.scrollIntoView();
  }, [registeredNow]);

  const failed = actionData?.ok === false;
  const values = actionData?.ok === false ? actionData.values : EMPTY_VALUES;

  return (
    <>
      {registeredNow ? (
        <p className="reg-status reg-status--ok" role="status">
          {REGISTER_SUCCESS_MESSAGE}
        </p>
      ) : (
        <Form method="post" className="reg-form" action={`${location.pathname}#register`}>
          <input type="hidden" name="renderedAt" value={renderedAt} />
          <input
            type="hidden"
            name="page"
            value={page === 'ghost-hosting' ? '/ghost-hosting' : '/'}
          />
          {/* Honeypot: out of the layout, out of the accessibility tree (aria-hidden)
              and out of reach (inert). Only a script filling every field in the raw
              HTML will populate it. */}
          <div className="reg-hp" aria-hidden="true" inert>
            <label htmlFor="register-fax">Fax</label>
            <input id="register-fax" type="text" name={HONEYPOT_FIELD_NAME} autoComplete="off" />
          </div>
          <div className="reg-field">
            <label htmlFor="register-name">Name</label>
            <input
              id="register-name"
              type="text"
              name="name"
              autoComplete="name"
              maxLength={NAME_MAX_LENGTH}
              defaultValue={values.name}
              required
            />
          </div>
          <div className="reg-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              name="email"
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
              defaultValue={values.email}
              required
            />
          </div>
          <div className="reg-field">
            <label htmlFor="register-organisation">Outlet or organisation</label>
            <input
              id="register-organisation"
              type="text"
              name="organisation"
              autoComplete="organization"
              maxLength={ORGANISATION_MAX_LENGTH}
              defaultValue={values.organisation}
            />
          </div>
          <div className="reg-field">
            <label htmlFor="register-publishing">What do you publish on today?</label>
            <textarea
              id="register-publishing"
              name="publishing"
              rows={4}
              maxLength={PUBLISHING_MAX_LENGTH}
              defaultValue={values.publishing}
            />
          </div>
          {failed && (
            <p className="reg-status reg-status--error" role="alert">
              {REGISTER_FAILURE_MESSAGE}
            </p>
          )}
          <button className="btn" type="submit" disabled={submitting}>
            Register interest
          </button>
        </Form>
      )}
      <p className="small">We use these details only to contact you about PublicPress.</p>
    </>
  );
}
