import { describe, expect, it } from 'vitest';

import {
  PAGES,
  POPUPS,
  canonicalUrl,
  isPopupId,
  normalizePath,
  pageKindForPath,
  pathForPopup,
  popupForPath,
} from './pages';

describe('the pop-up table', () => {
  it('lists the eight pop-ups with unique ids and paths', () => {
    expect(POPUPS).toHaveLength(8);
    expect(new Set(POPUPS.map((popup) => popup.id)).size).toBe(8);
    expect(new Set(POPUPS.map((popup) => popup.path)).size).toBe(8);
    expect(POPUPS.map((popup) => popup.path).sort()).toEqual(
      [
        '/about',
        '/everyone',
        '/how-its-built',
        '/included',
        '/moving',
        '/what-is-ghost',
        '/why',
        '/your-site',
      ].sort()
    );
  });

  it('round-trips every id through its path', () => {
    for (const popup of POPUPS) {
      expect(pathForPopup(popup.id)).toBe(popup.path);
      expect(popupForPath(popup.path)).toBe(popup.id);
      expect(isPopupId(popup.id)).toBe(true);
    }
  });

  it('refuses a value that is not a pop-up id', () => {
    expect(isPopupId('nope')).toBe(false);
    expect(isPopupId('')).toBe(false);
  });
});

describe('normalizePath', () => {
  it('drops trailing slashes and lower-cases, but leaves the root alone', () => {
    expect(normalizePath('/Included/')).toBe('/included');
    expect(normalizePath('/included///')).toBe('/included');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('popupForPath', () => {
  it('finds a pop-up whatever the case or trailing slash', () => {
    expect(popupForPath('/WHAT-IS-GHOST/')).toBe('ghost');
  });

  it('is null for the pages and for anything else', () => {
    expect(popupForPath('/')).toBeNull();
    expect(popupForPath('/ghost-hosting')).toBeNull();
    expect(popupForPath('/included/extra')).toBeNull();
    expect(popupForPath('/elsewhere')).toBeNull();
  });
});

describe('pageKindForPath', () => {
  it('serves the hosting page at /ghost-hosting only', () => {
    expect(pageKindForPath('/ghost-hosting')).toBe('ghost-hosting');
    expect(pageKindForPath('/Ghost-Hosting/')).toBe('ghost-hosting');
  });

  it('serves the journey for `/`, every pop-up path and every unknown path', () => {
    for (const path of ['/', '/included', '/zzz', '/zzz/yyy', '/ghost-hosting/more']) {
      expect(pageKindForPath(path)).toBe('journey');
    }
  });
});

describe('page metadata', () => {
  it('has a canonical URL per page, as the built pages had', () => {
    expect(canonicalUrl('journey')).toBe('https://publicpress.co.uk/');
    expect(canonicalUrl('ghost-hosting')).toBe('https://publicpress.co.uk/ghost-hosting');
  });

  it('carries each page its title and description', () => {
    expect(PAGES.journey.title).toBe(
      'Independent journalism, on independent infrastructure | PublicPress'
    );
    expect(PAGES['ghost-hosting'].title).toBe('Managed Ghost hosting, done well | PublicPress');
    expect(PAGES.journey.description.length).toBeGreaterThan(40);
    expect(PAGES['ghost-hosting'].description).toContain('from £15 a month');
  });
});
