import * as React from 'react';

import { LAUNCH_DATE } from '~/content/tokens';

/**
 * The launch-date pill and its "about this date" tooltip. The tooltip opens on
 * hover (CSS) and on click or tap (state); a click elsewhere or Escape closes it.
 */
export function DateNote(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    // Any click elsewhere closes it. A click on the button itself is the button's to
    // handle: React and this listener share the document, so stopping propagation
    // would not keep this one from running.
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && buttonRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <span className={open ? 'when open' : 'when'} id="when">
      <span className="pill when-pill">Launching by {LAUNCH_DATE}</span>
      <button
        ref={buttonRef}
        className="info"
        type="button"
        aria-expanded={open}
        aria-describedby="date-tip"
        aria-label="About this date"
        onClick={() => setOpen((current) => !current)}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 11v6" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <span className="tip" role="tooltip" id="date-tip">
        This is the latest date before which PublicPress will launch. We'll update this page if we
        can guarantee that we'll deliver ahead of time. By registering interest, we can start
        onboarding you and capturing your requirements before this date.
      </span>
    </span>
  );
}
