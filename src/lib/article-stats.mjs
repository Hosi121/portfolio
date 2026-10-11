import { Markdoc } from '@astrojs/markdoc/config';
import { readingStats } from './reading-stats.mjs';

function visibleText(node) {
  if (node.type === 'image' || node.type === 'comment' || node.type === 'frontmatter') return '';
  if (node.type === 'link' && /^#footnote-/.test(node.attributes.href || '')) return '';
  if (['text', 'code', 'fence'].includes(node.type)) return node.attributes.content || '';
  if (['softbreak', 'hardbreak'].includes(node.type)) return '\n';
  const text = (node.children || []).map(visibleText).join('');
  return ['paragraph', 'heading', 'fence'].includes(node.type) ? `${text}\n` : text;
}
export function articleStats(markdown = '', notes = []) {
  return readingStats(visibleText(Markdoc.parse(markdown)), notes);
}
