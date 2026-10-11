import { defineMarkdocConfig, nodes, Markdoc } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    link: {
      ...nodes.link,
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        const match = /^#footnote-([a-zA-Z0-9-]+)$/.exec(attributes.href || '');
        if (!match) return new Markdoc.Tag('a', attributes, children);
        return new Markdoc.Tag('sup', { class: 'footnote-reference', id: `footnote-ref-${match[1]}` }, [
          new Markdoc.Tag('a', { ...attributes, role: 'doc-noteref', 'aria-label': `脚注 ${children.join('')}` }, children),
        ]);
      },
    },
  },
});
