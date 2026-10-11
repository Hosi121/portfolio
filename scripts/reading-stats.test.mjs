import test from 'node:test';
import assert from 'node:assert/strict';
import { readingStats, editorText } from '../src/lib/reading-stats.mjs';
import { articleStats } from '../src/lib/article-stats.mjs';

test('counts graphemes, not whitespace, and rounds minutes up', () => {
  assert.deepEqual(readingStats(''), { characters: 0, minutes: 0 });
  assert.equal(readingStats('あいう　えお\n👨‍👩‍👧‍👦e\u0301').characters, 7);
  assert.equal(readingStats('あ'.repeat(500)).minutes, 1);
  assert.equal(readingStats('あ'.repeat(501)).minutes, 2);
});

test('Markdown markup, image alt and footnote numbers are excluded; code and notes count', () => {
  const source = '# 見出し\n\n**本文** [リンク](https://example.com/long-url) ![代替テキスト](image.png) [1](#footnote-note) `a < b`\n\n```js\nlet x = 1;\n```';
  const expected = '見出し本文リンクa<bletx=1;補足';
  assert.deepEqual(articleStats(source, [{ text: '補足' }]), readingStats(expected));
});

test('editor and article counts agree for formatting, emoji, code, images and notes', () => {
  const doc = { type: 'doc', content: [
    { type: 'heading', content: [{ type: 'text', text: '見出し' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '本文 👨‍👩‍👧‍👦' }, { type: 'footnote', attrs: { number: 1 } }] },
    { type: 'image', attrs: { alt: '数えない' } },
    { type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1;' }] },
  ] };
  const source = '# 見出し\n\n**本文** 👨‍👩‍👧‍👦[1](#footnote-note)\n\n![数えない](image.png)\n\n```js\nconst x = 1;\n```';
  const notes = [{ id: 'note', text: '補足 e\u0301' }];
  assert.deepEqual(readingStats(editorText(doc), notes), articleStats(source, notes));
});
