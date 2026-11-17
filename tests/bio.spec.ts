import { test, expect } from '@playwright/test';

test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map(error => error.message)).toEqual([]);
});

async function expectIconGrid(systems: import('@playwright/test').Locator) {
  await expect(systems.locator('.bio-system-grid')).toHaveCSS('display', 'grid');
  await expect(systems).toHaveCSS('background-color', 'rgb(250, 248, 244)');
  await expect(systems).not.toHaveCSS('box-shadow', 'none');
  const icons = await systems.getByRole('link').evaluateAll(links => links.map(link => {
    const rect = link.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const symbol = link.querySelector('svg, img')!.getBoundingClientRect();
    return { x, y, width: rect.width, symbolWidth: symbol.width, symbolHeight: symbol.height, reachable: document.elementFromPoint(x, y)?.closest('a') === link, symbolContained: symbol.x >= rect.x && symbol.y >= rect.y && symbol.right <= rect.right && symbol.bottom <= rect.bottom };
  }));
  const rows = [...new Set(icons.map(icon => Math.round(icon.y)))];
  expect(rows).toHaveLength(1);
  expect(icons).toHaveLength(8);
  expect(new Set(icons.map(icon => Math.round(icon.x))).size).toBe(8);
  expect(icons.every(icon => Math.abs(icon.symbolWidth - 10) < 0.1 && Math.abs(icon.symbolHeight - 10) < 0.1)).toBe(true);
  expect(icons.every(icon => icon.reachable)).toBe(true);
  expect(icons.every(icon => icon.symbolContained)).toBe(true);
}

for (const path of ['/', '/en.html']) {
  test(`biography previews on ${path} keep the text and layout in place`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const bio = page.locator('.bio');
    const systems = page.locator('#bio-systems');
    await expect(bio).toBeVisible();
    await expect(page.locator('.bio-trigger')).toHaveCount(3);
    await expect(systems).toBeHidden();
    const bounds = () => bio.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
    });
    const before = await bounds();

    await page.locator('[popovertarget="bio-systems"]').hover();
    await expect(systems).toBeVisible();
    const systemsAnchor = (await page.locator('[popovertarget="bio-systems"]').boundingBox())!;
    const systemsPanel = (await systems.boundingBox())!;
    expect(systemsPanel.y + systemsPanel.height).toBeLessThan(systemsAnchor.y);
    await expect(systems.getByRole('link')).toHaveCount(8);
    for (const name of ['PyTorch', 'OpenCV', 'ONNX Runtime', 'ncnn', 'MNN', 'Burn', 'tract', 'ESP-DL']) {
      await expect(systems.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(systems.locator('.bio-preview-icon')).toHaveCount(8);
    await expectIconGrid(systems);
    await expect.poll(() => systems.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('systems-preview.png'), animations: 'disabled' });
    expect(await bounds()).toEqual(before);
    await systems.getByRole('link').first().hover();
    await expect(systems).toBeVisible();
    await page.mouse.move(16, 16);
    await expect(systems).toBeHidden();

    await page.locator('[popovertarget="bio-speed"]').hover();
    const speed = page.locator('#bio-speed');
    await expect(speed).toBeVisible();
    const speedAnchor = (await page.locator('[popovertarget="bio-speed"]').boundingBox())!;
    const speedPanel = (await speed.boundingBox())!;
    expect(speedPanel.y + speedPanel.height).toBeLessThan(speedAnchor.y);
    const links = await speed.getByRole('link').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    const listed = await page.locator('#contributions-merged + ul a[title^="PR #"]').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    expect(links).toEqual(listed);
    expect(links).toHaveLength(7);
    await expect(speed.locator('.bio-preview-icon svg')).toHaveCount(3);
    await expect(speed).not.toContainText(/Col2im|Im2col|Transpose|MaxPool|SIMD/);
    expect(await bounds()).toEqual(before);
    await page.screenshot({ path: testInfo.outputPath('speed-preview.png'), animations: 'disabled' });
    await page.mouse.move(16, 16);
    await expect(speed).toBeHidden();
    await page.locator('[popovertarget="bio-safety"]').hover();
    const safety = page.locator('#bio-safety');
    await expect(safety).toBeVisible();
    await expect(safety.getByRole('link')).toHaveText(['Invisible Consent ↗', 'Secure & Usable Authentication ↗', 'FHE-Mamba ↗']);
    await expect(safety.locator('.bio-preview-icon[data-icon="chi"] img')).toHaveCount(2);
    await expect(safety.locator('.bio-preview-icon[data-icon="github"] svg')).toHaveCount(1);
    await expect.poll(() => safety.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await expect(safety.getByRole('link', { name: 'Invisible Consent', exact: true })).toHaveAttribute('href', 'https://ohkilab.github.io/invisible-consent/');
    await expect(safety.getByRole('link', { name: 'Secure & Usable Authentication', exact: true })).toHaveAttribute('href', 'https://ohkilab.github.io/expressionauth/');
    await expect(safety.getByRole('link', { name: 'FHE-Mamba', exact: true })).toHaveAttribute('href', 'https://github.com/Hosi121/fhe-mamba');
    const safetyAnchor = (await page.locator('[popovertarget="bio-safety"]').boundingBox())!;
    const safetyPanel = (await safety.boundingBox())!;
    expect(safetyPanel.y + safetyPanel.height).toBeLessThan(safetyAnchor.y);
    expect(await bounds()).toEqual(before);
    await page.screenshot({ path: testInfo.outputPath('safety-preview.png'), animations: 'disabled' });
  });
}

test('keyboard users can enter the preview links and dismiss with Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('[popovertarget="bio-systems"]');
  const preview = page.locator('#bio-systems');
  await trigger.focus();
  await expect(preview).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(preview.getByRole('link').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(page.locator('[popovertarget="bio-speed"]')).toBeFocused();
});

test.describe('touch', () => {
  test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });

  test('all previews fit narrow screens and close on an outside tap', async ({ page }, testInfo) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ['/', '/en.html']) {
        await page.goto(path);
        for (const kind of ['systems', 'speed', 'safety']) {
          await page.locator(`[popovertarget="bio-${kind}"]`).tap();
          const preview = page.locator(`#bio-${kind}`);
          await expect(preview).toBeVisible();
          if (kind === 'systems') await expectIconGrid(preview);
          const box = (await preview.boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.y + box.height).toBeLessThanOrEqual(844);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          if (kind === 'systems' && width === 390) await page.screenshot({ path: testInfo.outputPath(path === '/' ? 'mobile-ja.png' : 'mobile-en.png'), animations: 'disabled' });
          await page.touchscreen.tap(4, 4);
          await expect(preview).toBeHidden();
        }
      }
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the full biography and native click previews remain available', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.bio')).toContainText('その両方を通じて、人と計算機ができることを広げていきたい');
    await page.locator('[popovertarget="bio-speed"]').click();
    await expect(page.locator('#bio-speed')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#bio-speed')).toBeHidden();
  });
});

test('previews respect reduced motion and stay out of printed text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('[popovertarget="bio-speed"]').hover();
  await expect(page.locator('#bio-speed')).toBeVisible();
  await expect(page.locator('#bio-speed')).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#bio-speed')).toBeHidden();
  await expect(page.locator('.bio')).toBeVisible();
});
