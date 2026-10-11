import { test, expect } from '@playwright/test';
import { readFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

test('existing pages and blog keep their layout at mobile and desktop widths', async ({ page }, testInfo) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/en.html', '/blog/', '/blog/getting-started/', '/portfolio/blog/sample/hoge']) {
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (path === '/portfolio/blog/sample/hoge') await page.screenshot({ path: testInfo.outputPath(`sample-${width}.png`), fullPage: true });
      if (path === '/' || path === '/en.html') await expect(page.locator('.garden-art')).toHaveAttribute('data-ready', '');
    }
  }
});

test('local API rejects foreign origins, invalid paths and stale writes', async ({ request }) => {
  const slug = `api-test-${randomUUID()}`;
  const data = { slug, title: 'API test', date: '2026-09-28', body: 'First version', description: '', draft: true, revision: null };
  const headers = { 'X-Local-Editor': '1' };
  try {
    expect((await request.post('/api/editor/post', { data, headers: { ...headers, Origin: 'https://example.com' } })).status()).toBe(403);
    expect((await request.post('/api/editor/post', { data })).status()).toBe(403);
    expect((await request.post('/api/editor/post', { data: { ...data, slug: '../outside' }, headers })).status()).toBe(400);
    const created = await request.post('/api/editor/post', { data, headers });
    expect(created.ok()).toBe(true);
    const saved = await created.json();
    const writes = await Promise.all(['Second version', 'Other version'].map(body => request.post('/api/editor/post', { data: { ...data, body, revision: saved.revision }, headers })));
    expect(writes.map(result => result.status()).sort()).toEqual([200, 409]);
    expect((await request.post('/api/editor/post', { data, headers })).status()).toBe(409);
  } finally { await rm(`src/content/posts/${slug}.mdoc`, { force: true }); }
});

test('write directly on the article, save images, reopen, and preserve unsaved text', async ({ page }, testInfo) => {
  const slug = `inline-test-${randomUUID()}`;
  const file = `src/content/posts/${slug}.mdoc`;
  let imagePath: string | undefined;
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto('/blog/new');
    await page.getByLabel('タイトル', { exact: true }).fill('ページの上で書く記事');
    await page.getByLabel('URL名', { exact: true }).fill(slug);
    await page.getByLabel('日付', { exact: true }).fill('2026-09-28');
    await expect(page.locator('#live-reading-stats')).toHaveAttribute('data-characters', '0');
    await page.getByRole('textbox', { name: '本文', exact: true }).fill('あいう　えお👨‍👩‍👧‍👦é');
    await expect(page.locator('#live-reading-stats')).toHaveAttribute('data-characters', '7');
    await page.getByRole('textbox', { name: '本文', exact: true }).fill('このページで書いた本文です。');
    await expect(page.locator('#live-reading-stats')).toHaveAttribute('data-characters', '14');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '画像を追加', exact: true }).click();
    await (await chooser).setFiles('public/og-garden.png');
    await expect(page.locator('#inline-body img')).toBeVisible();
    imagePath = (await page.locator('#inline-body img').getAttribute('src'))!.slice(1);
    await expect(page.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect.poll(async () => readFile(file, 'utf8').catch(() => '')).toContain('このページで書いた本文です。');
    await expect(page.getByRole('status')).toContainText('手元に保存しました');
    await page.screenshot({ path: testInfo.outputPath('inline-editor.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('inline-editor-mobile.png'), fullPage: true });
    const editingCount = await page.locator('#live-reading-stats').getAttribute('data-characters');
    await page.getByRole('button', { name: '閲覧に戻る' }).click();
    await expect(page.locator('[data-reading-stats]')).toHaveAttribute('data-characters', editingCount!);
    await expect(page.locator('#article-title')).toHaveText('ページの上で書く記事');
    await expect(page.locator('#article-body')).toContainText('このページで書いた本文です。');
    await expect.poll(() => page.locator('#article-body img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await page.getByRole('button', { name: '編集', exact: true }).click();
    await page.getByRole('textbox', { name: '本文', exact: true }).fill('まだ保存していない文章');
    await page.reload();
    await expect(page.getByRole('textbox', { name: '本文', exact: true })).toContainText('まだ保存していない文章');
    await expect(page.getByRole('status')).toContainText('復元');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect.poll(async () => readFile(file, 'utf8')).toContain('まだ保存していない文章');
  } finally {
    await page.evaluate(() => sessionStorage.clear()).catch(() => {});
    await rm(file, { force: true });
    if (imagePath) await rm(imagePath, { force: true });
  }
});

test('footnotes survive save, renumber after deletion, and link back to the text', async ({ page }) => {
  const slug = `footnote-test-${randomUUID()}`;
  const file = `src/content/posts/${slug}.mdoc`;
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto('/blog/new');
    await page.getByLabel('タイトル', { exact: true }).fill('脚注の確認');
    await page.getByLabel('URL名', { exact: true }).fill(slug);
    await page.getByRole('textbox', { name: '本文', exact: true }).fill('本文の補足です。');
    await page.getByRole('button', { name: '脚注', exact: true }).click();
    await page.getByRole('textbox', { name: '脚注 1', exact: true }).fill('最初の注釈');
    await page.getByRole('button', { name: '脚注', exact: true }).click();
    await page.getByRole('textbox', { name: '脚注 2', exact: true }).fill('二番目の注釈 <script>alert(1)</script>');
    await expect(page.locator('#inline-body sup')).toHaveText(['1', '2']);
    const noteCount = await page.locator('#live-reading-stats').getAttribute('data-characters');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('手元に保存しました');
    await page.getByRole('button', { name: '閲覧に戻る' }).click();
    await expect(page.locator('.footnote-reference a')).toHaveCount(2);
    await expect(page.locator('[data-reading-stats]')).toHaveAttribute('data-characters', noteCount!);
    await expect(page.locator('#article-body .footnotes')).toContainText('二番目の注釈 <script>alert(1)</script>');
    await page.getByRole('link', { name: '脚注 1', exact: true }).click();
    const target = await page.getByRole('link', { name: '脚注 1', exact: true }).getAttribute('href');
    expect(new URL(page.url()).hash).toBe(target);
    await page.getByRole('link', { name: '本文の脚注 1 に戻る', exact: true }).click();
    expect(new URL(page.url()).hash).toContain('footnote-ref-');
    await page.getByRole('button', { name: '編集', exact: true }).click();
    await expect(page.getByRole('textbox', { name: '脚注 2', exact: true })).toHaveValue('二番目の注釈 <script>alert(1)</script>');
    await page.getByRole('button', { name: '脚注 1 を外す', exact: true }).click();
    await expect(page.locator('#inline-body sup')).toHaveText(['1']);
    await expect(page.getByRole('textbox', { name: '脚注 1', exact: true })).toHaveValue('二番目の注釈 <script>alert(1)</script>');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('手元に保存しました');
    const content = await readFile(file, 'utf8');
    expect(content).not.toContain('最初の注釈');
    expect(content).toContain('[1](#footnote-');
    await page.getByRole('button', { name: '閲覧に戻る' }).click();
    await expect(page.locator('.footnote-reference a')).toHaveText(['1']);
  } finally { await rm(file, { force: true }); }
});
