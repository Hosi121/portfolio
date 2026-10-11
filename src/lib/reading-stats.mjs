// Shared by the editor and static pages. Count user-perceived characters, so
// combining marks and emoji sequences are not counted as multiple characters.
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
export function readingStats(text, notes = []) {
  const complete = [text, ...notes.map(note => note.text)].join('\n');
  let characters = 0;
  for (const { segment } of segmenter.segment(complete)) {
    if (!/^\s+$/u.test(segment)) characters++;
  }
  return { characters, minutes: Math.ceil(characters / 500) };
}
export function formatReadingStats({ characters, minutes }) {
  return `${characters.toLocaleString('ja-JP')}文字 · 約${minutes}分`;
}
export function editorText(node) {
  if (node.type === 'image' || node.type === 'footnote') return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  const text = (node.content || []).map(editorText).join('');
  return ['paragraph', 'heading', 'codeBlock'].includes(node.type) ? `${text}\n` : text;
}
