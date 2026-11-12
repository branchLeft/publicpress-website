import * as React from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useSite } from '~/components/SiteContext';
import { PAGES, isPopupId, pathForPopup, popupForPath, type PopupId } from '~/lib/pages';
import { useHasMounted } from '~/lib/useHasMounted';

/**
 * The pop-ups. Which one is open is a function of the address bar: each has its
 * own path, the server renders the matching `<dialog>` open, and the browser's
 * history does the rest. Opening one pushes its path, closing it returns to the
 * page's own path, and Back closes it.
 */

type PopupApi = {
  /** The pop-up the address names, if any. */
  readonly active: PopupId | null;
  /** The page's own path, which closing a pop-up returns to. */
  readonly home: string;
  readonly open: (_id: PopupId) => void;
  /** Close the open pop-up. With a `#hash`, return home at that hash instead of going Back. */
  readonly close: (_hash?: string) => void;
  /** The element id to scroll to now the pop-up has finished closing, once; then none. */
  readonly takeScrollTarget: () => string | null;
};

const PopupContext = React.createContext<PopupApi | null>(null);

function usePopups(): PopupApi {
  const value = React.useContext(PopupContext);
  if (value === null) throw new Error('pop-ups must be used inside <PopupProvider>');
  return value;
}

function isBackable(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { back?: unknown }).back === true;
}

export function PopupProvider({ children }: { readonly children: React.ReactNode }) {
  const { page } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollAfterClose = React.useRef<string | null>(null);

  const active = popupForPath(location.pathname);
  const home = PAGES[page].path;
  const backable = isBackable(location.state);

  const open = React.useCallback(
    (id: PopupId) => {
      void navigate(pathForPopup(id), { state: { back: true }, preventScrollReset: true });
    },
    [navigate]
  );

  const close = React.useCallback(
    (hash?: string) => {
      if (active === null) return;
      // A pop-up this session opened has the page in the entry before it: go
      // Back to it. One reached by address (a reload, a shared link) has no
      // such entry, so replace it with the page's own path.
      if (hash === undefined && backable) {
        void navigate(-1);
        return;
      }
      if (hash !== undefined) scrollAfterClose.current = hash.slice(1);
      void navigate(
        { pathname: home, hash },
        { replace: true, preventScrollReset: hash === undefined }
      );
    },
    [active, backable, home, navigate]
  );

  // A `#hash` that points inside a closed pop-up (a section link, or one of the
  // sources) opens that pop-up and then scrolls to the target.
  React.useEffect(() => {
    if (!location.hash) return;
    let target: HTMLElement | null;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch {
      return;
    }
    const dialog = target instanceof HTMLDialogElement ? target : target?.closest('dialog');
    if (!target || !dialog || !isPopupId(dialog.id)) return;
    if (dialog.id !== active) {
      void navigate(
        { pathname: pathForPopup(dialog.id), hash: location.hash },
        { replace: true, preventScrollReset: true }
      );
      return;
    }
    if (target !== dialog) target.scrollIntoView();
  }, [location.hash, active, navigate]);

  const takeScrollTarget = React.useCallback(() => {
    const target = scrollAfterClose.current;
    scrollAfterClose.current = null;
    return target;
  }, []);

  const api = React.useMemo(
    () => ({ active, home, open, close, takeScrollTarget }),
    [active, home, open, close, takeScrollTarget]
  );
  return <PopupContext.Provider value={api}>{children}</PopupContext.Provider>;
}

type PopupProps = {
  readonly id: PopupId;
  /** The id of the heading that names the dialog. */
  readonly titleId: string;
  readonly children: React.ReactNode;
};

export function Popup({ id, titleId, children }: PopupProps): React.JSX.Element {
  const { active, home, close, takeScrollTarget } = usePopups();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const mounted = useHasMounted();
  const isOpen = active === id;

  // The native close event (Escape, the backdrop) must tell the router, but only
  // when the address still names this pop-up: a close the router asked for has
  // already moved the address on.
  const isOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    isOpenRef.current = isOpen;
  });

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mounted) return;
    if (isOpen) {
      // The server rendered it open but non-modal, which is all a page without
      // script can show. Reopen it as a modal for focus trapping and the backdrop.
      if (!dialog.matches(':modal')) {
        dialog.removeAttribute('open');
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
      const target = takeScrollTarget();
      if (target !== null) document.getElementById(target)?.scrollIntoView();
    }
  }, [isOpen, mounted, takeScrollTarget]);

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-labelledby={titleId}
      data-path={pathForPopup(id)}
      open={isOpen && !mounted}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      onClose={() => {
        if (isOpenRef.current) close();
      }}
    >
      <div className="bar">
        <a
          className="close"
          href={home}
          aria-label="Close"
          onClick={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </a>
      </div>
      <div className="sheet">{children}</div>
    </dialog>
  );
}

/** The "More about ..." button under each section: opens its pop-up. */
export function MoreButton({
  popup,
  children,
}: {
  readonly popup: PopupId;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const { open } = usePopups();
  return (
    <button className="more" onClick={() => open(popup)}>
      {children}
    </button>
  );
}

/** The "Register interest" button at the foot of each pop-up: close it and go to the form. */
export function RegisterLink(): React.JSX.Element {
  const { close } = usePopups();
  return (
    <a
      className="btn"
      href="#register"
      onClick={(event) => {
        event.preventDefault();
        close('#register');
      }}
    >
      Register interest
    </a>
  );
}
