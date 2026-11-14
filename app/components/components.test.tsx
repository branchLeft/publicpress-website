import { describe, expect, it } from 'vitest';

import { GhostHostingBody } from '~/content/GhostHostingBody';
import { JourneyBody } from '~/content/JourneyBody';
import { REGISTER_FAILURE_MESSAGE, REGISTER_SUCCESS_MESSAGE } from '~/content/register-messages';
import { POPUPS } from '~/lib/pages';
import { renderRoute } from '~/testing/renderRoute';
import { AnchoredHeading } from './AnchoredHeading';
import { DateNote } from './DateNote';
import { MoreButton, Popup, PopupProvider, RegisterLink } from './Popup';
import { RegisterForm } from './RegisterForm';
import { COMPACT_AFTER_PX, RELAX_BEFORE_PX, SiteHeader, nextCompact } from './SiteHeader';

const GHOST = { page: 'ghost-hosting', renderedAt: 1 } as const;

/** A message as React escapes it in server-rendered markup. */
function escaped(message: string): string {
  return message.replaceAll('&', '&amp;').replaceAll("'", '&#x27;').replaceAll('"', '&quot;');
}

describe('the page bodies, as a visitor without scripting receives them', () => {
  it.each([
    ['journey', <JourneyBody key="j" />, undefined],
    ['ghost-hosting', <GhostHostingBody key="g" />, GHOST],
  ] as const)('%s carries all eight pop-ups, each on its own path', async (_name, body, site) => {
    const html = await renderRoute(<PopupProvider>{body}</PopupProvider>, { site });
    for (const popup of POPUPS) {
      expect(html, popup.id).toMatch(
        new RegExp(`<dialog id="${popup.id}" aria-labelledby="[^"]+" data-path="${popup.path}"`)
      );
    }
    expect(html).not.toMatch(/<dialog[^>]* open/);
    expect(html).toContain('id="register"');
    expect(html).toContain('Launching by 1<sup>st</sup> March 2027');
    expect(html).toContain('Essentials');
  });

  it('has no inline style attribute, inline event handler, mailto link or data: URI', async () => {
    for (const body of [<JourneyBody key="j" />, <GhostHostingBody key="g" />]) {
      const html = await renderRoute(<PopupProvider>{body}</PopupProvider>);
      expect(html).not.toMatch(/\sstyle="/);
      expect(html).not.toMatch(/\son[a-z]+="/);
      expect(html).not.toContain('mailto:');
      expect(html).not.toContain('data:');
      expect(html).not.toContain('<script');
      expect(html).not.toContain('<style');
    }
  });

  it('puts the owner-approved copy in unchanged', async () => {
    const html = await renderRoute(
      <PopupProvider>
        <JourneyBody />
      </PopupProvider>
    );
    expect(html).toContain('Independent journalism, on independent infrastructure.');
    expect(html).toContain('Your Ghost site, without compromise.');
    expect(html).toContain('We use these details only to contact you about PublicPress.');
    expect(html).toContain('Operated by BRANCHLEFT LTD');
  });
});

describe('pop-ups', () => {
  const popup = (
    <PopupProvider>
      <Popup id="included" titleId="t">
        <h2 id="t">Included</h2>
      </Popup>
    </PopupProvider>
  );

  it('are rendered open, non-modal, when the address names them', async () => {
    const html = await renderRoute(popup, { url: 'http://localhost/included' });
    expect(html).toMatch(/<dialog id="included"[^>]* open=""/);
  });

  it('match the address however it is cased or slashed', async () => {
    const html = await renderRoute(popup, { url: 'http://localhost/INCLUDED/' });
    expect(html).toMatch(/<dialog id="included"[^>]* open=""/);
  });

  it('are closed at any other address', async () => {
    for (const url of [
      'http://localhost/',
      'http://localhost/why',
      'http://localhost/ghost-hosting',
    ]) {
      expect(await renderRoute(popup, { url })).not.toMatch(/ open/);
    }
  });

  it('close with a link to the page itself, which works without scripting', async () => {
    expect(await renderRoute(popup, { url: 'http://localhost/included' })).toContain(
      'class="close" href="/" aria-label="Close"'
    );
    expect(await renderRoute(popup, { url: 'http://localhost/included', site: GHOST })).toContain(
      'class="close" href="/ghost-hosting" aria-label="Close"'
    );
  });

  it('draw the round close button as an X', async () => {
    expect(await renderRoute(popup)).toContain('<path d="M6 6l12 12M18 6 6 18"></path>');
  });

  it('have an opener button and a register link', async () => {
    const html = await renderRoute(
      <PopupProvider>
        <MoreButton popup="why">Why we are doing this</MoreButton>
        <RegisterLink />
      </PopupProvider>
    );
    expect(html).toContain('<button class="more">Why we are doing this</button>');
    expect(html).toContain('<a class="btn" href="#register">Register interest</a>');
  });
});

describe('RegisterForm', () => {
  it('has the four fields with the agreed labels, and posts to the page itself', async () => {
    const html = await renderRoute(<RegisterForm />, { url: 'http://localhost/ghost-hosting' });
    expect(html).toMatch(/<form[^>]* method="post"/);
    expect(html).toMatch(/<form[^>]* action="\/ghost-hosting#register"/);
    expect(html).toMatch(/<label for="register-name">Name<\/label>/);
    expect(html).toMatch(/<label for="register-email">Email<\/label>/);
    expect(html).toMatch(/<label for="register-organisation">Outlet or organisation<\/label>/);
    expect(html).toMatch(
      /<label for="register-publishing">What do you publish on today\?<\/label>/
    );
    expect(html).toMatch(/<input id="register-name"[^>]* required=""/);
    expect(html).toMatch(/<input id="register-email" type="email"[^>]* required=""/);
    expect(html).not.toMatch(/<input id="register-organisation"[^>]* required/);
    expect(html).toContain('<textarea id="register-publishing"');
    expect(html).toContain('>Register interest</button>');
    expect(html).toContain('We use these details only to contact you about PublicPress.');
  });

  it('carries the render time and the page it is on, and a honeypot out of reach', async () => {
    const html = await renderRoute(<RegisterForm />, { site: GHOST });
    expect(html).toContain('name="renderedAt" value="1"');
    expect(html).toContain('name="page" value="/ghost-hosting"');
    expect(html).toMatch(/<div class="reg-hp" aria-hidden="true" inert=""[^>]*>/);
    expect(html).toContain('name="fax"');
    expect(html).toMatch(/<input id="register-fax"[^>]* autoComplete="off"/i);
  });

  it('shows the success message in place of the form', async () => {
    const html = await renderRoute(<RegisterForm />, { actionData: { ok: true } });
    expect(html).toContain('role="status"');
    expect(html).toContain(escaped(REGISTER_SUCCESS_MESSAGE));
    expect(html).not.toContain('<form');
    expect(html).toContain('We use these details only to contact you about PublicPress.');
  });

  it('shows the failure message above the form and keeps what was typed', async () => {
    const html = await renderRoute(<RegisterForm />, {
      actionData: {
        ok: false,
        values: {
          name: 'Ada <b>',
          email: 'ada@example.com',
          organisation: 'Gazette',
          publishing: 'x',
        },
      },
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain(escaped(REGISTER_FAILURE_MESSAGE));
    expect(html).toContain('<form');
    // The address is in the message as plain text, not a link.
    expect(html).toContain('email info@branchleft.co.uk.');
    expect(html).not.toContain('mailto:');
    expect(html).toContain('value="Ada &lt;b&gt;"');
    expect(html).toContain('value="ada@example.com"');
    expect(html).toContain('value="Gazette"');
  });

  it('does not show the info@ address or a mailto link', async () => {
    const html = await renderRoute(<RegisterForm />);
    expect(html).not.toContain('info@branchleft.co.uk');
    expect(html).not.toContain('mailto:');
  });
});

describe('small components', () => {
  it('the header links to #register and starts un-compacted', async () => {
    const html = await renderRoute(<SiteHeader />);
    expect(html).toContain('<header class="top" id="top">');
    expect(html).toContain('<a class="btn" href="#register">Register interest</a>');
    expect(html).toContain('aria-label="PublicPress, back to top"');
  });

  it('the header compacts past 80px and, once compact, relaxes only above 40px', () => {
    expect(nextCompact(false, COMPACT_AFTER_PX)).toBe(false);
    expect(nextCompact(false, COMPACT_AFTER_PX + 1)).toBe(true);
    expect(nextCompact(true, COMPACT_AFTER_PX)).toBe(true);
    expect(nextCompact(true, RELAX_BEFORE_PX)).toBe(true);
    expect(nextCompact(true, RELAX_BEFORE_PX - 1)).toBe(false);
    expect(nextCompact(false, 60)).toBe(false);
    expect(nextCompact(true, 60)).toBe(true);
  });

  it('headings carry no "#" link until the page has hydrated', async () => {
    const html = await renderRoute(
      <AnchoredHeading as="h2" id="x">
        Heading
      </AnchoredHeading>
    );
    expect(html).toBe('<h2 id="x">Heading</h2>');
  });

  it('the date note shows the launch date, closed', async () => {
    const html = await renderRoute(<DateNote />);
    expect(html).toContain('Launching by 1<sup>st</sup> March 2027');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('id="date-tip"');
  });
});
