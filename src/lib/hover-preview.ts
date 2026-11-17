let openingPreview = false;
document.querySelectorAll<HTMLElement>('[data-hover-preview]').forEach(reference => {
  const trigger = reference.querySelector<HTMLButtonElement>('[data-preview-trigger]')!;
  const preview = reference.querySelector<HTMLElement>('[data-preview-panel]')!;
  if (typeof preview.showPopover !== 'function') return;

  let pinned = false;
  let changing = false;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelClose = () => clearTimeout(closeTimer);
  const position = () => {
    if (!preview.matches(':popover-open')) return;
    const anchor = trigger.getBoundingClientRect();
    const panel = preview.getBoundingClientRect();
    const gutter = 16;
    const left = Math.max(gutter, Math.min(anchor.left + (anchor.width - panel.width) / 2, document.documentElement.clientWidth - panel.width - gutter));
    const above = anchor.top - panel.height - 10;
    const below = anchor.bottom + 10;
    const top = above >= gutter ? above
      : below + panel.height <= innerHeight - gutter ? below : Math.max(gutter, innerHeight - panel.height - gutter);
    preview.style.setProperty('--preview-left', `${left}px`);
    preview.style.setProperty('--preview-top', `${top}px`);
    preview.dataset.positioned = '';
  };
  const show = () => {
    cancelClose();
    if (openingPreview || changing) return;
    openingPreview = true;
    try {
      if (!preview.matches(':popover-open')) preview.showPopover();
      position();
    } finally { openingPreview = false; }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer = setTimeout(() => {
      if (!pinned && !reference.matches(':hover, :focus-within') && preview.matches(':popover-open')) preview.hidePopover();
    }, 160);
  };

  reference.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') show();
  });
  reference.addEventListener('pointerleave', scheduleClose);
  reference.addEventListener('focusin', () => {
    if (trigger.matches(':focus-visible')) show();
  });
  reference.addEventListener('focusout', event => {
    if (!(event.relatedTarget instanceof Node && reference.contains(event.relatedTarget))) {
      pinned = false;
      scheduleClose();
    }
  });
  trigger.addEventListener('click', event => {
    if (preview.matches(':popover-open') && !pinned) {
      event.preventDefault();
      pinned = true;
    } else pinned = !preview.matches(':popover-open');
  });
  preview.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!link) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    for (let section = target?.closest('details'); section; section = section.parentElement?.closest('details')) {
      section.open = true;
    }
    if (preview.matches(':popover-open')) preview.hidePopover();
  });
  preview.addEventListener('beforetoggle', () => {
    // Native dismissal can restore focus before the popover finishes closing.
    changing = true;
  });
  preview.addEventListener('toggle', event => {
    changing = false;
    if (event.newState === 'open') position();
    else { pinned = false; cancelClose(); }
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, { passive: true });
});
