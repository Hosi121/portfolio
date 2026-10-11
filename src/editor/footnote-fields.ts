import type { Editor } from '@tiptap/core';
export type Note = { id: string; text: string };

export function footnoteFields(editor: Editor, initial: Note[], changed: () => void) {
  const texts = new Map(initial.map(note => [note.id, note.text]));
  const section = document.getElementById('edit-footnotes')!;
  const list = document.getElementById('footnote-inputs')!;
  let active: string[] = [];
  let refreshing = false;
  function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const ids: string[] = [];
      const tr = editor.state.tr;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'footnote') return;
        let id = node.attrs.id;
        if (!/^[a-zA-Z0-9-]+$/.test(id) || ids.includes(id)) {
          const replacement = crypto.randomUUID();
          texts.set(replacement, texts.get(id) || ''); id = replacement;
        }
        ids.push(id);
        if (node.attrs.number !== ids.length || node.attrs.id !== id) tr.setNodeMarkup(pos, undefined, { id, number: ids.length });
      });
      active = ids;
      if (tr.docChanged) editor.view.dispatch(tr.setMeta('addToHistory', false));
      section.hidden = !ids.length;
      const remaining = new Set(ids);
      for (const child of Array.from(list.children)) if (!remaining.has((child as HTMLElement).dataset.id!)) child.remove();
      ids.forEach((id, index) => {
        let row = Array.from(list.children).find(child => (child as HTMLElement).dataset.id === id) as HTMLLIElement | undefined;
        if (!row) {
          row = document.createElement('li'); row.dataset.id = id;
          const field = document.createElement('textarea'); field.value = texts.get(id) || '';
          field.addEventListener('input', () => { texts.set(id, field.value); changed(); });
          const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '脚注を外す';
          remove.addEventListener('click', () => {
            const positions: number[] = [];
            editor.state.doc.descendants((node, pos) => { if (node.type.name === 'footnote' && node.attrs.id === id) positions.push(pos); });
            const transaction = editor.state.tr;
            positions.reverse().forEach(pos => transaction.delete(pos, pos + 1));
            editor.view.dispatch(transaction); editor.commands.focus();
          });
          row.append(field, remove);
        }
        row.querySelector('textarea')!.setAttribute('aria-label', `脚注 ${index + 1}`);
        row.querySelector('button')!.setAttribute('aria-label', `脚注 ${index + 1} を外す`);
        if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
      });
    } finally { refreshing = false; }
  }
  refresh();
  return {
    refresh,
    values: () => active.map(id => ({ id, text: texts.get(id) || '' })),
    add() {
      const id = crypto.randomUUID(); texts.set(id, '');
      const position = editor.state.selection.to;
      editor.chain().focus().insertContentAt(position, { type: 'footnote', attrs: { id, number: active.length + 1 } }).run();
      refresh();
      list.querySelector<HTMLTextAreaElement>(`li[data-id="${id}"] textarea`)?.focus();
    },
    setDisabled(disabled: boolean) { section.querySelectorAll<HTMLTextAreaElement | HTMLButtonElement>('textarea,button').forEach(field => field.disabled = disabled); },
  };
}
