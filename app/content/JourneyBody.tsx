import type * as React from 'react';
import { Dialogs } from './Dialogs';
import { Footer } from './Footer';
import { GhostAnim } from './GhostAnim';
import { Prices } from './Prices';
import headshot from '~/assets/images/headshot-320.webp?url';
import { BlMarkLarge } from './marks';
import { ENTRY_TIER } from './tokens';
import { AnchoredHeading } from '~/components/AnchoredHeading';
import { DateNote } from '~/components/DateNote';
import { MoreButton } from '~/components/Popup';
import { RegisterForm } from '~/components/RegisterForm';
import { SiteHeader } from '~/components/SiteHeader';

export function JourneyBody(): React.JSX.Element {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="wrap hero">
          <h1>Independent journalism, on independent infrastructure.</h1>
          <p className="tag">Your Ghost site, without compromise.</p>
          <p className="lede">
            Managed technical solutions for independent newsrooms in the UK, from a company that
            exists to support them.
          </p>
          <p className="go">
            <DateNote />
          </p>
        </section>
        <section className="wrap">
          <div className="beat ghost">
            <div>
              <AnchoredHeading as="h2" id="what-is-ghost">
                What is Ghost?
              </AnchoredHeading>
              <p>
                Ghost is open-source publishing software
                <sup>
                  <a href="#src-g1">1</a>
                </sup>{' '}
                made for independent publishers, and looked after by a non-profit foundation.
                <sup>
                  <a href="#src-g2">2</a>
                </sup>{' '}
                One place to publish your journalism, send it as a newsletter and earn from members,
                on a site that is entirely yours.
                <sup>
                  <a href="#src-g3">3</a>
                </sup>
              </p>
              <MoreButton popup="ghost">More about Ghost</MoreButton>
            </div>
            <GhostAnim />
          </div>
        </section>
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="looked-after">
              Everything looked after.
            </AnchoredHeading>
            <div>
              <p>
                Upgrades, maintenance, backups and reliability are included on every paid plan, so
                you can focus on your journalism.
              </p>
              <MoreButton popup="included">What's included</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="yours-section">
              Unmistakably yours.
            </AnchoredHeading>
            <div>
              <p>
                A standard theme with your brand, or a bespoke theme that's authentically your
                identity. On your own domain.
              </p>
              <MoreButton popup="yours">Your site, your way</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="bring">
              Bring what you've built.
            </AnchoredHeading>
            <div>
              <p>
                We bring the expertise to move you from WordPress and similar technologies, bringing
                your archive and your members with you.
              </p>
              <MoreButton popup="moving">How moving works</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="independent">
              Fully independent, without compromise.
            </AnchoredHeading>
            <div>
              <p>
                Hosted in the EU, with no AWS, Google Cloud or Azure, and your live site on
                renewable electricity.
              </p>
              <MoreButton popup="built">How PublicPress is built</MoreButton>
            </div>
          </div>
        </section>
        <section className="band mission">
          <div className="wrap inner">
            <AnchoredHeading as="h2" id="connects">
              The catalyst for independent journalism.
            </AnchoredHeading>
            <div className="say">
              <p>
                PublicPress is a real investment in independent journalism in the UK. We build Ghost
                hosting and a surrounding technical ecosystem to connect everyone's efforts.
              </p>
              <MoreButton popup="why">Why we are doing this</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap try">
          <div className="beat">
            <AnchoredHeading as="h2" id="try-it">
              Try it free, in minutes.
            </AnchoredHeading>
            <div>
              <p>
                Not sure PublicPress or Ghost is the right fit? Once PublicPress is live, you'll be
                able to trial your own site for free for 7 days, ready within minutes. We're sure
                you'll be impressed.
              </p>
              <p>
                Your own Ghost site, running on PublicPress, with nothing to install. Keep it on our{' '}
                {ENTRY_TIER} plan from your portal, or after seven days it is deleted.
              </p>
              <p>
                <a className="more" href="#register">
                  Register interest to hear when trials open
                </a>
              </p>
            </div>
          </div>
        </section>
        <Prices />
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="not-a-newsroom">
              Not a newsroom? You're welcome too.
            </AnchoredHeading>
            <div>
              <p>
                PublicPress is open to anyone who wants a Ghost site done well. Choosing us helps to
                fund the mission.
              </p>
              <MoreButton popup="everyone">Ghost hosting for everyone</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap">
          <div className="who">
            <img src={headshot} alt="Robert Murray" width="160" height="160" />
            <div>
              <AnchoredHeading as="h2" id="built-by">
                Built by{' '}
                <span className="bl">
                  <span className="blm">
                    <BlMarkLarge />
                  </span>
                  branchLeft
                </span>
                .
              </AnchoredHeading>
              <p>
                A UK company building technology for people & planet, founded and engineered by
                Robert Murray.
              </p>
              <MoreButton popup="about">
                Meet <span className="bl">branchLeft</span> and its founder
              </MoreButton>
            </div>
          </div>
        </section>
        <section className="register" id="register">
          <div className="wrap">
            <AnchoredHeading as="h2" id="register-heading">
              Be there from the start.
            </AnchoredHeading>
            <p className="lede">Tell us who you are and we'll be in touch before we launch.</p>
            <RegisterForm />
          </div>
        </section>
        <Footer />
      </main>
      <Dialogs />
    </>
  );
}
