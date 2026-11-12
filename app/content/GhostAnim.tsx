import type * as React from 'react';
import { useEffect, useRef } from 'react';

export function GhostAnim(): React.JSX.Element {
  const figureRef = useRef<HTMLElement>(null);

  // Without script the figure shows its finished state. With it, the `js` class
  // arms the animation and `is-playing` runs it once at least 40% is in view;
  // scrolling it fully out of view rearms it.
  useEffect(() => {
    const figure = figureRef.current;
    if (figure === null || !('IntersectionObserver' in window)) return;
    figure.classList.add('js');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.4) {
            figure.classList.add('is-playing');
          } else if (!entry.isIntersecting) {
            figure.classList.remove('js', 'is-playing');
            void figure.offsetWidth;
            figure.classList.add('js');
          }
        }
      },
      { threshold: [0, 0.4] }
    );
    observer.observe(figure);
    return () => {
      observer.disconnect();
      figure.classList.remove('js', 'is-playing');
    };
  }, []);

  return (
    <>
      <figure
        ref={figureRef}
        className="ghost-anim"
        aria-label="A story is written once in Ghost and published as a page on your website, an email newsletter and members-only content; a reader joins and the newsroom's member count goes up by one."
      >
        <svg viewBox="0 0 340 350" aria-hidden="true" focusable="false">
          <g transform="translate(4 176)">
            <g className="ga-drop dly-31">
              <rect className="ga-box" width="100" height="140" rx="6" />
              <path className="ga-line" d="M0 20H100" />
              <circle className="ga-ink" cx="10" cy="10" r="2.5" />
              <circle className="ga-ink" cx="19" cy="10" r="2.5" />
              <circle className="ga-ink" cx="28" cy="10" r="2.5" />
              <rect className="ga-pic" x="10" y="30" width="80" height="40" />
              <rect className="ga-ink" x="10" y="80" width="64" height="8" rx="1" />
              <rect className="ga-grey" x="10" y="98" width="80" height="4" rx="1" />
              <rect className="ga-grey" x="10" y="108" width="80" height="4" rx="1" />
              <rect className="ga-grey" x="10" y="118" width="48" height="4" rx="1" />
            </g>
          </g>
          <g transform="translate(120 176)">
            <g className="ga-drop dly-33">
              <rect className="ga-box" width="100" height="140" rx="6" />
              <path className="ga-line" d="M0 40H100" />
              <rect className="ga-box" x="10" y="10" width="28" height="20" rx="2" />
              <path className="ga-line" d="M10 11l14 10 14-10" />
              <circle className="ga-pink ga-pop dly-44" cx="38" cy="10" r="6" />
              <rect className="ga-ink" x="48" y="14" width="42" height="4" rx="1" />
              <rect className="ga-grey" x="48" y="22" width="28" height="4" rx="1" />
              <rect className="ga-pic" x="10" y="50" width="80" height="28" />
              <rect className="ga-ink" x="10" y="88" width="64" height="8" rx="1" />
              <rect className="ga-grey" x="10" y="106" width="80" height="4" rx="1" />
              <rect className="ga-grey" x="10" y="116" width="48" height="4" rx="1" />
            </g>
          </g>
          <g transform="translate(236 176)">
            <g className="ga-drop dly-35">
              <rect className="ga-box" width="100" height="140" rx="6" />
              <rect className="ga-ink" x="10" y="14" width="64" height="8" rx="1" />
              <rect className="ga-grey" x="10" y="30" width="80" height="4" rx="1" />
              <rect className="ga-grey" x="10" y="40" width="80" height="4" rx="1" />
              <g className="ga-in dly-55">
                <rect className="ga-grey" x="10" y="50" width="80" height="4" rx="1" />
                <rect className="ga-grey" x="10" y="60" width="80" height="4" rx="1" />
                <rect className="ga-grey" x="10" y="70" width="80" height="4" rx="1" />
                <rect className="ga-grey" x="10" y="80" width="80" height="4" rx="1" />
                <rect className="ga-grey" x="10" y="90" width="48" height="4" rx="1" />
              </g>
              <g className="ga-out dly-54 dur-03">
                <path className="ga-line" d="M44 70v-5a6 6 0 0 1 12 0v5" />
                <rect className="ga-ink" x="40" y="70" width="20" height="16" rx="2" />
              </g>
              <g className="ga-in dly-55">
                <rect className="ga-pink" x="14" y="104" width="72" height="26" rx="13" />
                <path className="ga-line" d="M43 117l5 5 10-11" />
              </g>
              <g className="ga-out ga-join">
                <rect className="ga-blue" x="14" y="104" width="72" height="26" rx="13" />
                <text className="ga-mid ga-onblue" x="50" y="122">
                  Join
                </text>
              </g>
            </g>
          </g>
          <rect className="ga-box" x="4" y="4" width="332" height="156" rx="8" />
          <path className="ga-line" d="M4 48H336M4 126H336" />
          <text className="ga-name" x="20" y="32">
            Ghost
          </text>
          <g className="ga-press dly-27">
            <rect className="ga-blue" x="244" y="12" width="80" height="28" rx="14" />
            <text className="ga-mid ga-onblue" x="284" y="31">
              Publish
            </text>
          </g>
          <rect
            className="ga-ink ga-grow dly-03 dur-08"
            x="20"
            y="62"
            width="200"
            height="12"
            rx="1"
          />
          <rect className="ga-grey ga-grow dly-11" x="20" y="86" width="300" height="4" rx="1" />
          <rect className="ga-grey ga-grow dly-16" x="20" y="98" width="300" height="4" rx="1" />
          <rect
            className="ga-grey ga-grow dly-21 dur-03"
            x="20"
            y="110"
            width="180"
            height="4"
            rx="1"
          />
          <rect className="ga-blue ga-out ga-cur" x="20" y="60" width="2" height="16" />
          <circle className="ga-ink" cx="27" cy="138" r="4" />
          <path className="ga-ink" d="M19 152a8 8 0 0 1 16 0z" />
          <text className="ga-out dly-60 dur-02" x="44" y="148">
            248 members
          </text>
          <text className="ga-in dly-62" x="44" y="148">
            249 members
          </text>
          <g className="ga-pop dly-62">
            <rect className="ga-pink" x="284" y="132" width="40" height="22" rx="11" />
            <text className="ga-mid" x="304" y="148">
              +1
            </text>
          </g>
          <text className="ga-mid ga-in dly-38" x="54" y="340">
            Website
          </text>
          <text className="ga-mid ga-in dly-40" x="170" y="340">
            Newsletter
          </text>
          <text className="ga-mid ga-in dly-42" x="286" y="340">
            Members
          </text>
        </svg>
      </figure>
    </>
  );
}
