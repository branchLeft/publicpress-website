import * as React from 'react';

import { Wordmark } from '~/content/marks';

/** Scrolled past this, the header compacts. */
export const COMPACT_AFTER_PX = 80;
/** Once compact, it relaxes only back above this, so no position sits on a single edge. */
export const RELAX_BEFORE_PX = 40;

/**
 * Whether the header is compact at `scrollY`, given whether it is now. Between
 * the two thresholds it keeps its state: a dead band, so a small scroll
 * adjustment at the edge cannot toggle it back and forth.
 */
export function nextCompact(compact: boolean, scrollY: number): boolean {
  return compact ? scrollY >= RELAX_BEFORE_PX : scrollY > COMPACT_AFTER_PX;
}

/**
 * The sticky header. Past 80px of scroll it compacts: the wordmark is clipped
 * to its first letter and the bar tightens. Its own box never changes height
 * (journey.css moves the bar with transforms), so compacting moves nothing on
 * the page and cannot shift the scroll back across the threshold.
 */
export function SiteHeader(): React.JSX.Element {
  const [compact, setCompact] = React.useState(false);
  React.useEffect(() => {
    const update = (): void => setCompact((was) => nextCompact(was, window.scrollY));
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
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
