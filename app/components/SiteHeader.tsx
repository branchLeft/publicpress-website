import * as React from 'react';

import { Wordmark } from '~/content/marks';

const COMPACT_AFTER_PX = 80;

function subscribe(onChange: () => void): () => void {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

/**
 * The sticky header. Past 80px of scroll it compacts: the wordmark is clipped
 * to its first letter and the bar tightens (the rules are in journey.css).
 */
export function SiteHeader(): React.JSX.Element {
  const compact = React.useSyncExternalStore(
    subscribe,
    () => window.scrollY > COMPACT_AFTER_PX,
    () => false
  );
  return (
    <header className={compact ? 'top compact' : 'top'} id="top">
      <div className="wrap inner">
        <a className="logo" href="#top" aria-label="PublicPress, back to top">
          <Wordmark />
        </a>
        <a className="btn" href="#register">
          Register interest
        </a>
      </div>
    </header>
  );
}
