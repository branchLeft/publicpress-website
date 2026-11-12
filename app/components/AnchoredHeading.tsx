import type * as React from 'react';
import type { ReactNode } from 'react';

import { useHasMounted } from '~/lib/useHasMounted';

type Props = {
  readonly as: 'h2' | 'h3';
  readonly id: string;
  readonly className?: string;
  readonly children: ReactNode;
};

/**
 * A heading that carries a "#" link to itself once the page has hydrated. The
 * link is script-added chrome: it is not in the server's HTML, so the page
 * reads the same without scripting.
 */
export function AnchoredHeading({ as: Tag, id, className, children }: Props): React.JSX.Element {
  const mounted = useHasMounted();
  return (
    <Tag id={id} className={className}>
      {children}
      {mounted && (
        <a className="anchor" href={`#${id}`} aria-label="Link to this section">
          #
        </a>
      )}
    </Tag>
  );
}
