const filterCleanups = new Map<HTMLElement, () => void>();
let lifecycleBound = false;

function initializeFilter(root: HTMLElement) {
  if (filterCleanups.has(root)) return;
  const controller = new AbortController();
  const { signal } = controller;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.tag-filter')];
  const rows = [...root.querySelectorAll<HTMLElement>('.post-row')];
  const empty = root.querySelector<HTMLElement>('.empty-state');

  const filter = (tag: string) => {
    let count = 0;
    const normalizedTag = tag.toLowerCase();
    buttons.forEach((button) => {
      const active = button.dataset.tag?.toLowerCase() === normalizedTag;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    rows.forEach((row) => {
      const show = normalizedTag === 'all'
        || (row.dataset.tags || '').toLowerCase().split('|').includes(normalizedTag);
      row.hidden = !show;
      if (show) count += 1;
    });
    if (empty) empty.hidden = count > 0;
  };

  const applyLocationFilter = () => {
    filter(new URLSearchParams(location.search).get('tag') || 'all');
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const tag = button.dataset.tag || 'all';
      filter(tag);
      history.replaceState(null, '', tag === 'all' ? location.pathname : `?tag=${encodeURIComponent(tag)}`);
    }, { signal });
  });
  addEventListener('popstate', applyLocationFilter, { signal });
  applyLocationFilter();

  const cleanup = () => {
    controller.abort();
    filterCleanups.delete(root);
  };
  filterCleanups.set(root, cleanup);
}

function cleanupFilters() {
  filterCleanups.forEach((cleanup) => cleanup());
}

export function initializeJournalFilters() {
  document.querySelectorAll<HTMLElement>('[data-journal-filter]').forEach(initializeFilter);
  if (lifecycleBound) return;
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll<HTMLElement>('[data-journal-filter]').forEach(initializeFilter);
  });
  document.addEventListener('astro:before-swap', cleanupFilters);
  window.addEventListener('pagehide', cleanupFilters);
  window.addEventListener('pageshow', () => {
    document.querySelectorAll<HTMLElement>('[data-journal-filter]').forEach(initializeFilter);
  });
  lifecycleBound = true;
}
