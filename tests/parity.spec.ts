import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

// The page copy is the owner's approved launch copy and was ported character for
// character. This compares the visible text of each page, as the server renders
// it, with the text of the built pages the old static site served (committed
// under tests/fixtures/reference/, byte for byte). The register block is the one
// place the pages differ by design, so it is cut out of both before comparing.
//
// Runs with JavaScript disabled: the reference pages' own script would otherwise
// add "#" links to the headings, and the text compared is the server's.

/**
 * The text of the document, in reading order, with whitespace collapsed (as a
 * browser collapses it) and a marker wherever a block element starts or ends,
 * so `</h3><p>` and `</h3>\n<p>` read the same but `</b>text` and `</b> text` do not.
 * SVG text elements count as blocks: the whitespace between them is never drawn.
 */
async function readableText(page: Page, registerBlock: string): Promise<string> {
  return page.evaluate((blockSelector) => {
    const BLOCKS =
      'address,article,aside,blockquote,dialog,div,dl,dt,dd,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hr,li,main,nav,ol,p,pre,section,table,thead,tbody,tr,td,th,ul,button,label,svg,text';
    const root = document.body.cloneNode(true) as HTMLElement;
    root.querySelectorAll('script, style').forEach((node) => node.remove());
    root.querySelectorAll(blockSelector).forEach((node) => node.remove());
    root.querySelectorAll(BLOCKS).forEach((element) => {
      element.before(document.createTextNode('\uE000'));
      element.after(document.createTextNode('\uE000'));
    });
    return (root.textContent ?? '')
      .replace(/[ \t\r\n\u00a0]+/g, ' ')
      .replace(/ ?\uE000[ \uE000]*/g, '\uE000')
      .trim();
  }, registerBlock);
}

function firstDifference(a: string, b: string): string {
  const length = Math.min(a.length, b.length);
  let at = 0;
  while (at < length && a[at] === b[at]) at += 1;
  const show = (text: string) => JSON.stringify(text.slice(Math.max(0, at - 60), at + 80));
  return `first difference at ${at}\nreference: ${show(a)}\napp:       ${show(b)}`;
}

for (const { path, file } of [
  { path: '/', file: 'index.html' },
  { path: '/ghost-hosting', file: 'ghost-hosting.html' },
]) {
  test(`${path}: the visible text matches the built page`, async ({ page, context }) => {
    const reference = await context.newPage();
    await reference.setContent(readFileSync(`tests/fixtures/reference/${file}`, 'utf8'));
    // The mailto block: the button and the visible address.
    const expected = await readableText(reference, '.reg-go');

    await page.goto(path);
    // The form that replaces it.
    const actual = await readableText(page, 'form.reg-form');

    expect(expected.length).toBeGreaterThan(5000);
    expect(actual === expected, firstDifference(expected, actual)).toBe(true);
  });
}

test('the reference and the app mark their register blocks the way this test expects', async ({
  page,
  context,
}) => {
  const reference = await context.newPage();
  await reference.setContent(readFileSync('tests/fixtures/reference/index.html', 'utf8'));
  await expect(reference.locator('.reg-go')).toHaveCount(1);
  await expect(reference.locator('.reg-go')).toContainText('info@branchleft.co.uk');
  await page.goto('/');
  await expect(page.locator('form.reg-form')).toHaveCount(1);
  await expect(page.locator('#register')).not.toContainText('info@branchleft.co.uk');
});
