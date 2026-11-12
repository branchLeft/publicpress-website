import type * as React from 'react';
import { BlMark } from './marks';

export function Footer(): React.JSX.Element {
  return (
    <>
      <footer className="site-foot">
        <div className="wrap footer-inner">
          <div className="foot-brand">
            <p className="credit">
              PublicPress™, a platform, ecosystem & community for independent journalism. Built for
              people & planet by <BlMark />
              <b>branchLeft</b>.
            </p>
            <p>Operated by BRANCHLEFT LTD</p>
            <p>Ghost is a trade mark of the Ghost Foundation. PublicPress is independent of it.</p>
          </div>
          <div className="foot-contact">
            <p>
              <span className="label" data-copy="">
                Complaints
              </span>
              <span className="addr">complaints@branchleft.co.uk</span>
            </p>
            <p>
              <span className="label" data-copy="">
                Seen spam, phishing or other misuse on a PublicPress site? Report it to:
              </span>
              <span className="addr">abuse@branchleft.co.uk</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
