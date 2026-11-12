import type * as React from 'react';
import { Dialogs } from './Dialogs';
import { Footer } from './Footer';
import { GhostAnim } from './GhostAnim';
import { Prices } from './Prices';
import { AnchoredHeading } from '~/components/AnchoredHeading';
import { DateNote } from '~/components/DateNote';
import { MoreButton } from '~/components/Popup';
import { RegisterForm } from '~/components/RegisterForm';
import { SiteHeader } from '~/components/SiteHeader';

export function GhostHostingBody(): React.JSX.Element {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="wrap hero short">
          <h1>Managed Ghost hosting, done well.</h1>
          <p className="tag">For writers, charities, clubs and small businesses in the UK.</p>
          <ul className="who-for" aria-label="Who it is for">
            <li>Writers and bloggers</li>
            <li>Charities</li>
            <li>Clubs and societies</li>
            <li>Small businesses</li>
            <li>Hobbyists</li>
          </ul>
          <p className="lede">
            Your own Ghost site, with upgrades, backups, newsletters and support looked after, on
            independent infrastructure in the EU. Every site you host with us helps fund independent
            journalism.
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
                Ghost is open-source publishing software,
                <sup>
                  <a href="#src-g1">1</a>
                </sup>{' '}
                looked after by a non-profit foundation.
                <sup>
                  <a href="#src-g2">2</a>
                </sup>{' '}
                One place to publish, send newsletters and earn from members, on a site that is
                entirely yours.
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
                you can spend your time on what you publish, not on servers.
              </p>
              <MoreButton popup="included">What's included</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="yours-section">
              Your design, your address.
            </AnchoredHeading>
            <div>
              <p>
                Pick a standard theme and make it yours, or have one designed around you. Use your
                own domain, or a free publicpress.co.uk address.
              </p>
              <MoreButton popup="yours">Your site, your way</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="bring">
              Moving from WordPress, Substack or Squarespace?
            </AnchoredHeading>
            <div>
              <p>
                We move your posts, images and subscribers for you, and keep your old links working.
              </p>
              <MoreButton popup="moving">How moving works</MoreButton>
            </div>
          </div>
        </section>
        <section className="wrap">
          <div className="beat">
            <AnchoredHeading as="h2" id="independent">
              Hosted independently, in the EU.
            </AnchoredHeading>
            <div>
              <p>
                No AWS, Google Cloud or Azure, and your live site runs on renewable electricity.
              </p>
              <MoreButton popup="built">How PublicPress is built</MoreButton>
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
                Once PublicPress is live, you'll be able to trial your own Ghost site free for 7
                days, ready within minutes, with nothing to install.
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
        <section className="band mission">
          <div className="wrap inner">
            <AnchoredHeading as="h2" id="connects">
              Your site helps fund independent journalism.
            </AnchoredHeading>
            <div className="say">
              <p>
                PublicPress exists to support independent journalism in the UK, not to make a
                profit. Hosting your Ghost site with us helps pay for that work.
              </p>
              <p>
                <a className="more" href="https://publicpress.co.uk/">
                  PublicPress for independent newsrooms
                </a>
              </p>
              <MoreButton popup="why">Why we are doing this</MoreButton>
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
