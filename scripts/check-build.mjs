import { writeFile, rm, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const id = `build-check-${randomUUID()}`;
const published = `src/content/posts/${id}.mdoc`;
const draft = `src/content/posts/${id}-draft.mdoc`;
function build() {
  const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  assert.equal(result.status, 0, 'build succeeds');
}
try {
  for (const [file, isDraft] of [[published, false], [draft, true]]) {
    await writeFile(file, `---\ntitle: ${isDraft ? id + '-draft' : id}\ndate: 2026-09-27\ndraft: ${isDraft}\nfootnotes:\n  - id: source\n    text: Published footnote.\n---\n\nBuild verification article.[1](#footnote-source)\n`);
  }
  build();
  const html = await readFile(`dist/blog/${id}/index.html`, 'utf8');
  assert.ok(html.includes('Build verification article.'));
  assert.ok(html.includes('Published footnote.'));
  assert.ok(html.includes('data-characters="43"'));
  assert.ok(html.includes('data-minutes="1"'));
  assert.ok(html.includes('43文字 · 約1分'));
  assert.ok(html.includes('id="footnote-source"'));
  assert.ok(html.includes('href="#footnote-ref-source"'));
  assert.ok(html.includes('role="doc-noteref"'));
  assert.ok(html.includes('/portfolio/styles.css'));
  assert.ok(!html.includes('id="local-editor"'));
  assert.ok(!html.includes('/src/editor/'));
  assert.ok(!html.includes('id="inline-body"'));
  assert.ok((await stat('dist/en.html')).isFile());
  for (const file of ['dist/blog/index.html', 'dist/rss.xml', 'dist/sitemap.xml', 'dist/index.html']) {
    const text = await readFile(file, 'utf8');
    assert.ok(text.includes(id), `${file} includes published post`);
    assert.ok(!text.includes(id + '-draft'), `${file} excludes draft`);
    assert.ok(!text.includes('getting-started'), `${file} excludes sample draft`);
  }
  for (const file of [`dist/blog/${id}-draft`, 'dist/blog/getting-started', 'dist/keystatic', 'dist/api', 'dist/blog/new', 'dist/portfolio/blog/sample/hoge']) {
    assert.equal(await stat(file).then(() => true, () => false), false, `${file} not published`);
  }
  console.log('Public article, draft exclusion, RSS, sitemap, admin exclusion, and legacy URL checks passed.');
} finally {
  await rm(published, { force: true });
  await rm(draft, { force: true });
  build();
}
