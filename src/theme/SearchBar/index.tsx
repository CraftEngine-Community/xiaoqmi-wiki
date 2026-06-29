import React, {useEffect, useMemo} from 'react';
import {useLocation} from '@docusaurus/router';
import * as OriginalSearchBarModule from '@theme-original/SearchBar';

const OriginalSearchBar =
  (OriginalSearchBarModule as any).default ?? OriginalSearchBarModule;

type ScopeInfo = {
  project: string;
  searchScope: string;
  label: string;
};

type StoredModalPosition = {
  left: number;
  top: number;
};

const DOCSEARCH_POSITION_STORAGE_KEY = 'xqm-docsearch-modal-position';

function escapeAlgoliaFilterValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getScopeFromPathname(pathname: string): ScopeInfo | null {
  const parts = pathname.split('/').filter(Boolean);

  // Handle Docusaurus i18n paths like /zh-Hans/tutorials/craftengine/
  if (parts[0] === 'en' || parts[0] === 'zh-Hans') {
    parts.shift();
  }

  const [section, project] = parts;

  if (!section || !project) {
    return null;
  }

  if (section === 'tutorials') {
    return {
      project,
      searchScope: `tutorial:${project}`,
      label: titleCase(project),
    };
  }

  if (section === 'projects') {
    return {
      project,
      searchScope: `project:${project}`,
      label: titleCase(project),
    };
  }

  return null;
}

function closeDocSearch() {
  const closeButton = document.querySelector<HTMLElement>(
    '.DocSearch-Cancel, .DocSearch-Close, button[aria-label="Close"]',
  );

  closeButton?.click();

  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
    }),
  );
}

function focusDocSearchInput() {
  const input = document.querySelector<HTMLInputElement>('.DocSearch-Input');

  if (input) {
    input.focus();
    input.select();
  }
}

function readStoredModalPosition(): StoredModalPosition | null {
  try {
    const value = window.localStorage.getItem(DOCSEARCH_POSITION_STORAGE_KEY);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as Partial<StoredModalPosition>;

    if (typeof parsed.left !== 'number' || typeof parsed.top !== 'number') {
      return null;
    }

    return {
      left: parsed.left,
      top: parsed.top,
    };
  } catch {
    return null;
  }
}

function writeStoredModalPosition(position: StoredModalPosition) {
  try {
    window.localStorage.setItem(
      DOCSEARCH_POSITION_STORAGE_KEY,
      JSON.stringify(position),
    );
  } catch {
    // Ignore storage failures; dragging should still work for this session.
  }
}

function clampModalPosition(modal: HTMLElement, position: StoredModalPosition) {
  const modalWidth = modal.offsetWidth;
  const modalHeight = modal.offsetHeight;

  return {
    left: Math.max(8, Math.min(position.left, window.innerWidth - modalWidth - 8)),
    top: Math.max(8, Math.min(position.top, window.innerHeight - modalHeight - 8)),
  };
}

function applyModalPosition(modal: HTMLElement, position: StoredModalPosition) {
  const nextPosition = clampModalPosition(modal, position);

  modal.style.position = 'fixed';
  modal.style.left = `${nextPosition.left}px`;
  modal.style.top = `${nextPosition.top}px`;
  modal.style.right = 'auto';
  modal.style.bottom = 'auto';
  modal.style.margin = '0';
  modal.style.transform = 'none';

  return nextPosition;
}

function useDocSearchEnhancer() {
  useEffect(() => {
    const enhanceModal = () => {
      const modal = document.querySelector<HTMLElement>('.DocSearch-Modal');

      if (!modal) {
        return;
      }

      let titlebar = modal.querySelector<HTMLElement>('.xqm-docsearch-titlebar');

      if (!titlebar) {
        titlebar = document.createElement('div');
        titlebar.className = 'xqm-docsearch-titlebar';

        const title = document.createElement('div');
        title.className = 'xqm-docsearch-titlebar-title';
        title.textContent = 'Search';

        const actions = document.createElement('div');
        actions.className = 'xqm-docsearch-titlebar-actions';

        const dragHint = document.createElement('span');
        dragHint.className = 'xqm-docsearch-drag-hint';
        dragHint.textContent = 'Drag';

        const closeButton = document.createElement('button');
        closeButton.className = 'xqm-docsearch-close';
        closeButton.type = 'button';
        closeButton.textContent = 'x';
        closeButton.setAttribute('aria-label', 'Close search');
        closeButton.onclick = closeDocSearch;

        actions.appendChild(dragHint);
        actions.appendChild(closeButton);
        titlebar.appendChild(title);
        titlebar.appendChild(actions);

        modal.insertBefore(titlebar, modal.firstChild);
      }

      if (!modal.dataset.positionReady) {
        modal.dataset.positionReady = 'true';

        const storedPosition = readStoredModalPosition();

        if (storedPosition) {
          requestAnimationFrame(() => {
            applyModalPosition(modal, storedPosition);
          });
        }
      }

      if (!titlebar.dataset.dragReady) {
        titlebar.dataset.dragReady = 'true';

        titlebar.addEventListener('pointerdown', (event) => {
          const target = event.target as HTMLElement;

          if (target.closest('button')) {
            return;
          }

          event.preventDefault();

          const rect = modal.getBoundingClientRect();
          const offsetX = event.clientX - rect.left;
          const offsetY = event.clientY - rect.top;

          applyModalPosition(modal, {
            left: rect.left,
            top: rect.top,
          });
          modal.dataset.dragging = 'true';

          const onPointerMove = (moveEvent: PointerEvent) => {
            applyModalPosition(modal, {
              left: moveEvent.clientX - offsetX,
              top: moveEvent.clientY - offsetY,
            });
          };

          const onPointerUp = () => {
            modal.dataset.dragging = 'false';
            const nextRect = modal.getBoundingClientRect();

            writeStoredModalPosition({
              left: nextRect.left,
              top: nextRect.top,
            });

            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
          };

          document.addEventListener('pointermove', onPointerMove);
          document.addEventListener('pointerup', onPointerUp);
        });
      }
    };

    enhanceModal();

    let enhancementQueued = false;
    const queueEnhancement = () => {
      if (enhancementQueued) {
        return;
      }

      enhancementQueued = true;
      requestAnimationFrame(() => {
        enhancementQueued = false;
        enhanceModal();
      });
    };

    const observer = new MutationObserver(queueEnhancement);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  // Ctrl/Cmd + K behavior:
  // closed => let DocSearch open normally
  // opened but input not selected => focus/select input
  // opened and selected => close
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

      if (!isSearchShortcut) {
        return;
      }

      const modal = document.querySelector<HTMLElement>('.DocSearch-Modal');

      if (!modal) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const input = modal.querySelector<HTMLInputElement>('.DocSearch-Input');

      if (!input) {
        return;
      }

      const inputIsFocused = document.activeElement === input;
      const inputIsFullySelected =
        input.value.length === 0 ||
        (input.selectionStart === 0 && input.selectionEnd === input.value.length);

      if (inputIsFocused && inputIsFullySelected) {
        closeDocSearch();
      } else {
        input.focus();
        input.select();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);
}

function useRefreshOpenDocSearch(filters: string | undefined) {
  useEffect(() => {
    const modal = document.querySelector<HTMLElement>('.DocSearch-Modal');
    const input = modal?.querySelector<HTMLInputElement>('.DocSearch-Input');

    if (!input) {
      return;
    }

    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, [filters]);
}

export default function SearchBar(props: any) {
  const {pathname} = useLocation();

  const scope = useMemo(() => getScopeFromPathname(pathname), [pathname]);
  useDocSearchEnhancer();

  const filters = useMemo(() => {
    if (!scope) {
      return undefined;
    }

    return `searchScope:"${escapeAlgoliaFilterValue(scope.searchScope)}"`;
  }, [scope]);

  useRefreshOpenDocSearch(filters);

  return (
    <OriginalSearchBar
      {...props}
      searchParameters={{
        ...props.searchParameters,
        ...(filters ? {filters} : {}),
      }}
    />
  );
}
