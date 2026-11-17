import { test, expect } from '@playwright/test';

// Keep hover assertions independent of animated fragment scrolling.
test.use({ reducedMotion: 'reduce' });

const groups = [
  { id: 'contributions-other-merged', projects: [
    { name: 'ncnn', repository: 'Tencent/ncnn', prs: [7015] },
    { name: 'MNN', repository: 'alibaba/MNN', prs: [4897, 4912] },
    { name: 'Burn', repository: 'tracel-ai/burn', prs: [5761] },
    { name: 'MLX Audio', repository: 'Blaizzy/mlx-audio', prs: [982] },
    { name: 'tract', repository: 'sonos/tract', prs: [2909] },
    { name: 'ESP-DL', repository: 'espressif/esp-dl', prs: [332, 334] },
  ] },
  { id: 'contributions-proposed', projects: [
    { name: 'vLLM', repository: 'vllm-project/vllm', prs: [58514] },
    { name: 'ONNX Runtime', repository: 'microsoft/onnxruntime', prs: [33032] },
    { name: 'Candle', repository: 'huggingface/candle', prs: [3988] },
    { name: 'vLLM-Omni', repository: 'vllm-project/vllm-omni', prs: [8230, 8114, 8113] },
    { name: 'tract', repository: 'sonos/tract', prs: [2957] },
    { name: 'ESP-DL', repository: 'espressif/esp-dl', prs: [333, 335] },
  ] },
];

test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map(error => error.message)).toEqual([]);
});

for (const path of ['/', '/en.html']) {
  test(`ONNX Runtime descriptions on ${path} show only their matching PRs`, async ({ page }, testInfo) => {
    const operations = [
      { ja: 'Col2im', en: 'Col2im', prs: [32698, 32800] },
      { ja: 'Im2col', en: 'Im2col', prs: [32817] },
      { ja: 'Transpose', en: 'Transpose', prs: [32891] },
      { ja: 'MaxPool', en: 'MaxPool', prs: [32936] },
    ];
    await page.goto(`${path}#open-source`);
    await page.waitForLoadState('networkidle');
    const contributions = page.locator('ul[aria-labelledby="contributions-merged"]');
    for (const operation of operations) {
      const trigger = contributions.getByRole('button', { name: operation[path === '/' ? 'ja' : 'en'], exact: true });
      const preview = page.locator(`#${await trigger.getAttribute('popovertarget')}`);
      await trigger.hover();
      await expect(preview).toBeVisible();
      await expect(preview.getByRole('link')).toHaveText(operation.prs.map(number => `#${number}`));
      expect(await preview.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href'))))
        .toEqual(operation.prs.map(number => `https://github.com/microsoft/onnxruntime/pull/${number}`));
      if (operation.ja === 'Im2col') await page.screenshot({ path: testInfo.outputPath('onnx-preview.png'), animations: 'disabled' });
      await page.mouse.move(4, 4);
      await expect(preview).toBeHidden();
    }
  });

  test(`contribution icons on ${path} reveal all original PR links on hover`, async ({ page }, testInfo) => {
    await page.goto(`${path}#open-source`);
    await page.waitForLoadState('networkidle');
    for (const { id, projects } of groups) {
      const group = page.locator(`section[aria-labelledby="${id}"]`);
      await expect(group.locator('summary, .disclosure')).toHaveCount(0);
      await expect(group.getByRole('button')).toHaveCount(6);
      const bounds = () => group.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
      });
      const before = await bounds();
      for (const project of projects) {
        const trigger = group.getByRole('button', { name: project.name, exact: true });
        const panel = page.locator(`#${await trigger.getAttribute('popovertarget')}`);
        await trigger.hover();
        await expect(panel).toBeVisible();
        await expect(panel.getByRole('link')).toHaveText(project.prs.map(number => `#${number}`));
        expect(await panel.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href'))))
          .toEqual(project.prs.map(number => `https://github.com/${project.repository}/pull/${number}`));
        expect(await bounds()).toEqual(before);
        await panel.getByRole('link').first().hover();
        await expect(panel).toBeVisible();
        if (project.name === 'MNN') await page.screenshot({ path: testInfo.outputPath('pr-preview.png'), animations: 'disabled' });
        await page.mouse.move(4, 4);
        await expect(panel).toBeHidden();
      }
    }
  });
}

test('keyboard users can reach PR links and dismiss the preview with Escape', async ({ page }) => {
  await page.goto('/#open-source');
  const trigger = page.locator('.contribution-group').first().getByRole('button').first();
  const panel = page.locator(`#${await trigger.getAttribute('popovertarget')}`);
  await trigger.focus();
  await expect(panel).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(panel.getByRole('link').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test.describe('touch', () => {
  test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });

  test('icon rows and PR previews fit narrow screens and dismiss on an outside tap', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ['/', '/en.html']) {
        await page.goto(`${path}#open-source`);
        for (const { id } of groups) {
          const group = page.locator(`section[aria-labelledby="${id}"]`);
          const buttons = group.getByRole('button');
          await group.scrollIntoViewIfNeeded();
          const rows = await buttons.evaluateAll(buttons => buttons.map(button => Math.round(button.getBoundingClientRect().y)));
          expect(new Set(rows).size).toBe(1);
          for (const trigger of await buttons.all()) {
            const panel = page.locator(`#${await trigger.getAttribute('popovertarget')}`);
            await trigger.tap();
            await expect(panel).toBeVisible();
            const box = (await panel.boundingBox())!;
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(width);
            expect(box.y).toBeGreaterThanOrEqual(0);
            expect(box.y + box.height).toBeLessThanOrEqual(844);
            await page.touchscreen.tap(4, 4);
            await expect(panel).toBeHidden();
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      }
    }
  });
});
