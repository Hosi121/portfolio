import { Markdoc } from '@astrojs/markdoc/config';
import { readFile, writeFile, mkdir, rename, lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { parse, stringify } from 'yaml';

const root = resolve('src/content/posts');
const images = resolve('src/assets/posts');
const revision = text => createHash('sha256').update(text).digest('hex');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const locks = new Map();
function pathFor(slug) {
  if (typeof slug !== 'string' || slug === 'new' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(slug)) throw fail('URL名には英数字・ハイフン・アンダースコアを使ってください。');
  return resolve(root, `${slug}.mdoc`);
}
async function load(slug) {
  const path = pathFor(slug);
  if ((await lstat(path)).isSymbolicLink()) throw fail('シンボリックリンクは編集できません。');
  const text = await readFile(path, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw fail('記事の形式を読み取れません。元のファイルは変更していません。');
  const data = parse(match[1]);
  // Do not silently flatten content that this rich text editor cannot round-trip.
  if (/{[%{]|<\/?[a-zA-Z][^>]*>/.test(match[2])) throw fail('この本文には独自タグやHTMLがあります。元のファイルで編集してください。');
  return { ...data, body: match[2].trim(), revision: revision(text) };
}
async function body(req, limit = 8 * 1024 * 1024) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw fail('ファイルが大きすぎます（上限8MB）。', 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function validate(data) {
  const notes = data.footnotes ?? [];
  if (!Array.isArray(notes) || notes.length > 100 || notes.some(note => !note || typeof note.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(note.id) || typeof note.text !== 'string' || !note.text.trim() || note.text.length > 20000)) throw fail('脚注の本文を入力してください（100件まで）。');
  const refs = [];
  if (typeof data.body === 'string') {
    for (const node of Markdoc.parse(data.body).walk()) {
      if (node.type === 'link' && /^#footnote-/.test(node.attributes.href || '')) refs.push(node.attributes.href.slice(10));
    }
  }
  if (new Set(refs).size !== refs.length || refs.length !== notes.length || refs.some((id, index) => id !== notes[index].id)) throw fail('脚注番号と注釈が一致しません。編集画面で確認してください。');
  if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 300) throw fail('タイトルを1〜300文字で入力してください。');
  if (typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date) throw fail('正しい日付を入力してください。');
  if (typeof data.body !== 'string' || data.body.length > 1000000 || /{%/.test(data.body)) throw fail('本文の形式または長さを確認してください。');
  if (typeof data.description !== 'string' || data.description.length > 2000 || typeof data.draft !== 'boolean') throw fail('概要または下書き設定を確認してください。');
}
async function save(data) {
  const path = pathFor(data.slug);
  validate(data);
  const previous = locks.get(path) || Promise.resolve();
  const work = previous.catch(() => {}).then(async () => {
    let existing;
    try { existing = await load(data.slug); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (existing ? existing.revision !== data.revision : data.revision !== null) throw fail('別のタブやファイルで更新されています。入力をコピーしてからページを開き直してください。', 409);
    const metadata = { ...(existing || {}), title: data.title.trim(), date: data.date, description: data.description, draft: data.draft, footnotes: data.footnotes ?? [] };
    delete metadata.body; delete metadata.revision;
    const text = `---\n${stringify(metadata)}---\n\n${data.body.trim()}\n`;
    await mkdir(root, { recursive: true });
    const temp = `${path}.${randomUUID()}.tmp`;
    await writeFile(temp, text, { flag: 'wx' });
    await rename(temp, path);
    return { revision: revision(text), url: `/blog/${encodeURIComponent(data.slug)}/` };
  });
  locks.set(path, work);
  try { return await work; } finally { if (locks.get(path) === work) locks.delete(path); }
}

export default function localEditor() {
  return { name: 'local-inline-editor', hooks: { 'astro:route:setup': ({ route }) => {
    if (route.component.endsWith('/blog/[id].astro')) route.prerender = false;
  }, 'astro:config:setup': ({ injectRoute, updateConfig }) => {
    injectRoute({ pattern: '/portfolio/blog/sample/hoge', entrypoint: './src/editor/Sample.astro' });
    injectRoute({ pattern: '/api/editor/state', entrypoint: './src/editor/State.ts', prerender: false });
    injectRoute({ pattern: '/blog/new', entrypoint: './src/editor/NewPost.astro' });
    updateConfig({ vite: { plugins: [{ name: 'local-editor-api', configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/editor/') || req.url.split('?')[0] === '/api/editor/state') return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        try {
          const host = req.headers.host;
          if (!host || !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) throw fail('ローカルからアクセスしてください。', 403);
          if (req.headers.origin && req.headers.origin !== `http://${host}`) throw fail('この送信元からは保存できません。', 403);
          if (req.method === 'POST' && req.headers['x-local-editor'] !== '1') throw fail('編集画面から保存してください。', 403);
          const url = new URL(req.url, `http://${host}`);
          let result;
          if (url.pathname === '/api/editor/post' && req.method === 'GET') result = await load(url.searchParams.get('slug'));
          else if (url.pathname === '/api/editor/post' && req.method === 'POST') result = await save(JSON.parse((await body(req)).toString()));
          else if (url.pathname === '/api/editor/image' && req.method === 'POST') {
            const bytes = await body(req);
            let ext;
            if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ext = 'png';
            else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ext = 'jpg';
            else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') ext = 'webp';
            else if (/^GIF8[79]a/.test(bytes.toString('ascii', 0, 6))) ext = 'gif';
            else throw fail('PNG・JPEG・WebP・GIFの画像を選んでください。');
            const filename = `${randomUUID()}.${ext}`;
            await mkdir(images, { recursive: true });
            await writeFile(resolve(images, filename), bytes, { flag: 'wx' });
            result = { src: `/src/assets/posts/${filename}` };
          } else throw fail('見つかりません。', 404);
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = error.code === 'ENOENT' ? 404 : error.status || 500;
          res.end(JSON.stringify({ error: error.status || error.code === 'ENOENT' ? error.message : '保存に失敗しました。入力を残したまま再試行してください。' }));
        }
      });
    } }] } });
  } } };
}
