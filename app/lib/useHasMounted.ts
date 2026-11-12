import * as React from 'react';

const subscribeNoop = () => () => {};

/**
 * True once the client has hydrated, false during SSR and the first client
 * render. `useSyncExternalStore`'s mismatched server/client snapshots make
 * React reconcile to `true` right after hydration, with no extra setState call.
 */
export function useHasMounted(): boolean {
  return React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}
