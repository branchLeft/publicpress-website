import type * as React from 'react';
import { useState, type KeyboardEvent } from 'react';
import { ENTRY_TIER } from './tokens';
import { AnchoredHeading } from '~/components/AnchoredHeading';

const TABS = [
  { key: 'mx', label: 'Our mail server' },
  { key: 'sw', label: 'Sweego' },
  { key: 'mg', label: 'Mailgun' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function Prices(): React.JSX.Element {
  const [selected, setSelected] = useState<TabKey>('mx');

  // Left and Right move between the tabs and select the one they land on.
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    const next = TABS[(index + step + TABS.length) % TABS.length];
    if (next === undefined) return;
    setSelected(next.key);
    document.getElementById(`tab-${next.key}`)?.focus();
  }

  return (
    <>
      <section className="prices">
        <div className="wrap">
          <AnchoredHeading as="h2" id="prices">
            Plans and prices.
          </AnchoredHeading>
          <div className="price-grid">
            <div className="price">
              <h3>{ENTRY_TIER}</h3>
              <p className="amount">£15</p>
              <p className="per">a month, or £150 a year</p>
              <p>
                A fully functioning Ghost site, configurable and styled. Up to 10,000 newsletter
                sends a month. Support by email, access to our client portal and documentation.
              </p>
            </div>
            <div className="price">
              <h3>Professional</h3>
              <p className="amount">from £65</p>
              <p className="per">a month, or from £650 a year</p>
              <p>
                Everything in {ENTRY_TIER}. A dedicated machine running only your Ghost site. Up to
                100,000 newsletter sends a month, or commit to more at-cost, or dynamic pricing over
                that amount. Priority support, guided onboarding and 1 hour of hands-on help each
                month.
              </p>
            </div>
            <div className="price">
              <h3>Bespoke work</h3>
              <p className="amount">£65/hr</p>
              <p className="per">or negotiable rates for public interest work</p>
              <p>
                Themes, features, integrations and migrations. Substantial onboarding work can be
                done at reduced rates for larger committed spend.
              </p>
            </div>
          </div>
          <div className="mail">
            <h3 id="sending">Sending your newsletters and log-in emails</h3>
            <p>
              No member caps on any plan. Choose the email delivery option that works best for you.
            </p>
            <div className="tabs" role="tablist" aria-label="How your emails are sent">
              {TABS.map((tab, index) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-controls={`mail-${tab.key}`}
                  aria-selected={selected === tab.key}
                  tabIndex={selected === tab.key ? 0 : -1}
                  onClick={() => setSelected(tab.key)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div
              className="panel"
              role="tabpanel"
              id="mail-mx"
              aria-labelledby="tab-mx"
              hidden={selected !== 'mx'}
            >
              <p>
                <b>A bespoke, unique offering:</b> we're not aware of any other Ghost hosting
                company that offers a sovereign mail server alongside it. Built in, on our own
                independent infrastructure. Nothing else to sign up to or pay for. We are committed
                to continually improving the mail server's reputation and deliverability, and you
                can track it in our client portal and switch at any time.
              </p>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Plan</th>
                      <th scope="col">Newsletter sends a month</th>
                      <th scope="col">Log-in emails</th>
                      <th scope="col">Mail costs</th>
                      <th scope="col">You pay a month</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">{ENTRY_TIER}</th>
                      <td>up to 10,000</td>
                      <td>unlimited</td>
                      <td>included</td>
                      <td>£15</td>
                    </tr>
                    <tr>
                      <th scope="row">Professional</th>
                      <td>up to 100,000</td>
                      <td>unlimited</td>
                      <td>included</td>
                      <td>from £65</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="panel"
              role="tabpanel"
              id="mail-sw"
              aria-labelledby="tab-sw"
              hidden={selected !== 'sw'}
            >
              <p>
                <b>A unique integration:</b> we're not aware of any other Ghost hosting company that
                offers integration with an alternative to Mailgun. Enables the quality of service of
                a third-party email provider but from Sweego, an EU-based email provider closer
                aligned with our values. Higher-reliability delivery at Sweego's price on top of
                your plan.
              </p>
              <p>
                We hold one plan with Sweego and your emails draw from it, so there is no Sweego
                account for you to manage and you pay for what you send.
              </p>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Plan</th>
                      <th scope="col" className="w">
                        Emails a month, newsletters and log-ins together
                      </th>
                      <th scope="col">Mail costs</th>
                      <th scope="col">You pay a month</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">{ENTRY_TIER}</th>
                      <td>10,000</td>
                      <td>about €4*</td>
                      <td>£15 + about €4*</td>
                    </tr>
                    <tr>
                      <th scope="row">{ENTRY_TIER}</th>
                      <td>50,000</td>
                      <td>about €20*</td>
                      <td>£15 + about €20*</td>
                    </tr>
                    <tr>
                      <th scope="row">Professional</th>
                      <td>100,000</td>
                      <td>about €40*</td>
                      <td>from £65 + about €40*</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="panel"
              role="tabpanel"
              id="mail-mg"
              aria-labelledby="tab-mg"
              hidden={selected !== 'mg'}
            >
              <p>
                Already have a Mailgun plan? Bring it and pay Mailgun directly. We support it
                because it's the default that Ghost supports, but we don't set it up for you.
              </p>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Plan</th>
                      <th scope="col" className="w">
                        Emails a month, newsletters and log-ins together
                      </th>
                      <th scope="col">Mail costs</th>
                      <th scope="col">You pay a month</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">{ENTRY_TIER}</th>
                      <td>10,000</td>
                      <td>from $15*, paid to Mailgun</td>
                      <td>£15 + from $15*</td>
                    </tr>
                    <tr>
                      <th scope="row">Professional</th>
                      <td>100,000</td>
                      <td>$90*, paid to Mailgun</td>
                      <td>from £65 + $90*</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="fine">
              * Based on Sweego's and Mailgun's own published monthly prices in November 2026,
              excluding tax. They set them and may change them.
            </p>
          </div>
          <p className="note">
            If your work benefits the public and you are operating as a CIC, co-operative or
            similar, we may be able to sponsor or arrange an improved agreement for our Professional
            tier.
          </p>
        </div>
      </section>
    </>
  );
}
