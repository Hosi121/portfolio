import { Node } from '@tiptap/core';

export const Footnote = Node.create({
  name: 'footnote', group: 'inline', inline: true, atom: true,
  addAttributes() { return { id: { default: '' }, number: { default: 1 } }; },
  parseHTML() {
    return [{ tag: 'sup[data-footnote]', getAttrs: element => ({ id: element.getAttribute('data-footnote'), number: Number(element.textContent) }) }];
  },
  renderHTML({ node }) {
    return ['sup', { 'data-footnote': node.attrs.id, class: 'footnote-reference', title: `脚注 ${node.attrs.number}` }, String(node.attrs.number)];
  },
  markdownTokenizer: {
    name: 'footnote', level: 'inline', start: src => src.indexOf('['),
    tokenize(src) {
      const match = /^\[(\d+)\]\(#footnote-([a-zA-Z0-9-]+)\)/.exec(src);
      if (match) return { type: 'footnote', raw: match[0], id: match[2], number: Number(match[1]) };
    },
  },
  parseMarkdown: (token, helpers) => helpers.createNode('footnote', { id: token.id, number: token.number }),
  renderMarkdown: node => `[${node.attrs?.number}](#footnote-${node.attrs?.id})`,
});
