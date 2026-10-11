import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import localEditor from './src/editor/integration.mjs';

const editing = process.argv.includes('dev');
export default defineConfig({
  site: 'https://hosi121.github.io',
  base: editing ? '/' : '/portfolio',
  // Refresh previews manually so file writes cannot interrupt inline editing.
  vite: { optimizeDeps: { include: ['@tiptap/core', '@tiptap/starter-kit', '@tiptap/extension-image', '@tiptap/markdown'] } },
  devToolbar: { enabled: false },
  integrations: [markdoc(), ...(editing ? [localEditor()] : [])],
});
