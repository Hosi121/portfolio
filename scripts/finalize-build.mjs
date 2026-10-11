import { readFile, rm, writeFile } from 'node:fs/promises';
// Astro emits the literal en.html route as a directory. Preserve the original
// public file URL, including relative asset and language-switch links.
const html = await readFile('dist/en.html/index.html');
await rm('dist/en.html', { recursive: true });
await writeFile('dist/en.html', html);
