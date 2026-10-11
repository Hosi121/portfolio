import { editorText, readingStats, formatReadingStats } from '../lib/reading-stats.mjs';
import { Footnote } from './footnote';
import { footnoteFields } from './footnote-fields';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from '@tiptap/markdown';

const controls = document.querySelector<HTMLElement>('#local-editor');
if (controls) {
  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const start = el<HTMLButtonElement>('start-edit');
  const save = el<HTMLButtonElement>('save-post');
  const finish = el<HTMLButtonElement>('finish-edit');
  const options = el('edit-options');
  const title = document.querySelector<HTMLTextAreaElement>('[data-edit-title]')!;
  const heading = el('article-title');
  const body = el('article-body');
  const editorBody = el('inline-body');
  const date = el<HTMLInputElement>('post-date');
  const draft = el<HTMLInputElement>('post-draft');
  const description = el<HTMLInputElement>('post-description');
  const slugInput = el<HTMLInputElement>('post-slug');
  const status = el('save-status');
  const error = el('edit-error');
  const isNew = controls.dataset.new === 'true';
  const key = `portfolio-draft:${location.pathname}`;
  let editor: Editor | undefined;
  let notes: ReturnType<typeof footnoteFields> | undefined;
  let revision: string | null = null;
  let savedUrl = isNew ? '' : location.pathname;
  let dirty = false;
  let saving = false;
  let uploading = false;
  let editing = false;
  const errorMessage = (message = '') => { error.textContent = message; error.hidden = !message; const copy = el('saved-copy'); if (copy) copy.hidden = !message; };
  const toEditor = (text: string) => text.replaceAll('../../assets/posts/', '/src/assets/posts/');
  const toFile = (text: string) => text.replaceAll('/src/assets/posts/', '../../assets/posts/');
  function values() {
    return { slug: slugInput?.value || controls!.dataset.slug, title: title.value, date: date.value, draft: draft.checked, description: description.value, body: toFile(editor?.getMarkdown() || ''), footnotes: notes?.values() || [], revision };
  }
  function updateReadingStats() {
    if (!editor) return;
    const stats = readingStats(editorText(editor.getJSON()), notes?.values() || []);
    const counter = el('live-reading-stats');
    counter.textContent = formatReadingStats(stats);
    counter.dataset.characters = String(stats.characters);
    counter.dataset.minutes = String(stats.minutes);
  }
  function remember() {
    if (!editing) return;
    updateReadingStats();
    dirty = true;
    status.textContent = '未保存';
    try { sessionStorage.setItem(key, JSON.stringify(values())); } catch { errorMessage('復元用の一時保存ができません。ページを閉じる前に保存してください。'); }
  }
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`/api/editor/${path}`, { ...init, headers: { 'X-Local-Editor': '1', ...init.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '保存できませんでした。');
    return data;
  }
  function setBusy(busy: boolean) {
    save.disabled = busy; finish.disabled = busy;
    options.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button').forEach(input => input.disabled = busy);
    notes?.setDisabled(busy);
    title.readOnly = busy; editor?.setEditable(!busy, false);
  }
  async function begin() {
    start.disabled = true;
    errorMessage();
    try {
      let data = isNew ? { title: '', body: '', date: new Date().toLocaleDateString('sv-SE'), description: '', draft: true, revision: null } : await request(`post?slug=${encodeURIComponent(controls!.dataset.slug!)}`);
      let recovered = false;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const previous = JSON.parse(stored);
        const same = ['title', 'body', 'date', 'description', 'draft'].every(field => previous[field] === data[field]) && JSON.stringify(previous.footnotes || []) === JSON.stringify(data.footnotes || []);
        if (same) sessionStorage.removeItem(key);
        else { data = previous; recovered = true; }
      }
      revision = data.revision;
      title.value = data.title; date.value = data.date; draft.checked = data.draft; description.value = data.description || '';
      if (slugInput) slugInput.value = data.slug || '';
      heading.hidden = true; body.hidden = true;
      title.hidden = false; editorBody.hidden = false; options.hidden = false;
      start.hidden = true; save.hidden = false; finish.hidden = false;
      editor = new Editor({
        element: editorBody,
        extensions: [StarterKit.configure({ underline: false, link: { openOnClick: false }, heading: { levels: [2, 3] } }), Image, Footnote, Markdown],
        content: toEditor(data.body), contentType: 'markdown',
        editorProps: { attributes: { role: 'textbox', 'aria-label': '本文', 'aria-multiline': 'true' } },
        onUpdate: () => { notes?.refresh(); remember(); },
        onTransaction: ({ editor }) => {
          document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(button => button.setAttribute('aria-pressed', String(editor.isActive(button.dataset.command!))));
        },
      });
      notes = footnoteFields(editor, data.footnotes || [], remember);
      editing = true; dirty = recovered;
      el('live-reading-stats').hidden = false;
      document.querySelectorAll<HTMLElement>('[data-reading-stats]').forEach(counter => counter.hidden = true);
      updateReadingStats();
      status.textContent = recovered ? '未保存の文章を復元しました' : 'このページで編集できます';
      if (isNew) title.focus();
    } catch (e) { errorMessage((e as Error).message); }
    finally { start.disabled = false; }
  }
  start.addEventListener('click', begin);
  [title, date, draft, description, slugInput].filter(Boolean).forEach(input => input.addEventListener('input', remember));
  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(button => button.addEventListener('click', () => {
    if (!editor) return;
    const chain = editor.chain().focus();
    const command = button.dataset.command;
    if (command === 'heading') chain.toggleHeading({ level: 2 }).run();
    else if (command === 'bold') chain.toggleBold().run();
    else if (command === 'italic') chain.toggleItalic().run();
    else if (command === 'bulletList') chain.toggleBulletList().run();
    else if (command === 'blockquote') chain.toggleBlockquote().run();
    else if (command === 'codeBlock') chain.toggleCodeBlock().run();
  }));
  el('add-footnote').addEventListener('click', () => notes?.add());
  el('add-link').addEventListener('click', () => {
    el('link-fields').hidden = false;
    el<HTMLInputElement>('link-url').value = editor?.getAttributes('link').href || '';
    el<HTMLInputElement>('link-url').focus();
  });
  el('apply-link').addEventListener('click', () => {
    const href = el<HTMLInputElement>('link-url').value.trim();
    if (href && !/^(https?:\/\/|mailto:)/i.test(href)) return errorMessage('リンク先は https://、http://、mailto: から入力してください。');
    if (href) editor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
    else editor?.chain().focus().unsetLink().run();
    el('link-fields').hidden = true; errorMessage();
  });
  el('choose-image').addEventListener('click', () => el<HTMLInputElement>('post-image').click());
  el<HTMLInputElement>('post-image').addEventListener('change', async event => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !editor) return;
    uploading = true; setBusy(true); errorMessage(); status.textContent = '画像を保存中…';
    try {
      const data = await request('image', { method: 'POST', body: file, headers: { 'Content-Type': file.type } });
      editor.chain().focus().setImage({ src: data.src, alt: file.name.replace(/\.[^.]+$/, '') }).run();
      remember();
    } catch (e) { errorMessage((e as Error).message); }
    finally { uploading = false; setBusy(false); input.value = ''; }
  });
  save.addEventListener('click', async () => {
    if (saving || uploading) return;
    if (notes?.values().some(note => !note.text.trim())) return errorMessage('脚注の本文を入力してください。');
    remember(); saving = true; setBusy(true); errorMessage(); status.textContent = '保存中…';
    try {
      const result = await request('post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values()) });
      revision = result.revision; savedUrl = result.url;
      if (slugInput) slugInput.readOnly = true;
      dirty = false; sessionStorage.removeItem(key);
      status.textContent = '手元に保存しました';
    } catch (e) { status.textContent = '未保存'; errorMessage((e as Error).message); }
    finally { saving = false; setBusy(false); }
  });
  finish.addEventListener('click', async () => {
    if (dirty) return errorMessage('先に保存してください。未保存の文章はこのタブに保持しています。');
    if (!savedUrl) { location.href = '/blog/'; return; }
    setBusy(true); status.textContent = '表示を更新中…'; errorMessage();
    const expected = values();
    try {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const state = await request(`state?slug=${encodeURIComponent(expected.slug!)}`);
        if (state && state.title === expected.title.trim() && state.body === expected.body.trim() && state.date === expected.date && state.description === expected.description && state.draft === expected.draft && JSON.stringify(state.footnotes || []) === JSON.stringify(expected.footnotes)) {
          location.href = savedUrl; return;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      throw new Error('保存は完了していますが、表示の更新が遅れています。少し待ってから「閲覧に戻る」を押してください。');
    } catch (e) { status.textContent = '手元に保存済み'; errorMessage((e as Error).message); setBusy(false); }
  });
  window.addEventListener('keydown', event => {
    if (editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (!saving && !uploading) save.click(); }
  });
  window.addEventListener('beforeunload', event => {
    if (dirty && !saving) { event.preventDefault(); event.returnValue = ''; }
  });
  // Vite can refresh the preview after a file write. The session copy survives it.
  if (isNew || sessionStorage.getItem(key)) begin();
}
