import React, {useEffect, useMemo} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
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
const DEFAULT_SEARCH_PAGE_PATH = 'search';

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
    input.focus({preventScroll: true});
    const caretPosition = input.value.length;

    input.setSelectionRange(caretPosition, caretPosition);
  }
}

function focusDocSearchInputWithoutMovingCaret(input: HTMLInputElement) {
  input.focus({preventScroll: true});
}

type StableResultsFooterProps = {
  state: {
    query?: string;
    collections?: Array<{
      items?: Array<{
        type?: string;
      }>;
    }>;
  };
  searchPagePath: string;
};

const latestSearchResultCounts = new Map<string, number>();

function getQueryFromSearchRequest(request: any) {
  if (typeof request?.query === 'string') {
    return request.query;
  }

  const params = request?.params;

  if (typeof params === 'string') {
    return new URLSearchParams(params).get('query') ?? '';
  }

  if (typeof params?.query === 'string') {
    return params.query;
  }

  return '';
}

function recordSearchResultCounts(requests: any, response: any) {
  const requestList = Array.isArray(requests) ? requests : requests?.requests;
  const results = response?.results;

  if (!Array.isArray(requestList) || !Array.isArray(results)) {
    return;
  }

  const countsByQuery = new Map<string, number>();

  results.forEach((result: any, index: number) => {
    const query =
      typeof result?.query === 'string'
        ? result.query
        : getQueryFromSearchRequest(requestList[index]);
    const nbHits = typeof result?.nbHits === 'number' ? result.nbHits : 0;

    if (!query) {
      return;
    }

    countsByQuery.set(query, (countsByQuery.get(query) ?? 0) + nbHits);
  });

  countsByQuery.forEach((count, query) => {
    latestSearchResultCounts.set(query, count);
  });
}

function getVisibleResultCount(state: StableResultsFooterProps['state']) {
  return (
    state.collections?.reduce((total, collection) => {
      const items = collection.items ?? [];

      return (
        total +
        items.filter((item) => item.type !== 'askAI').length
      );
    }, 0) ?? 0
  );
}

function StableResultsFooter({state, searchPagePath}: StableResultsFooterProps) {
  const searchPageLink = useBaseUrl(searchPagePath);
  const searchLink = state.query
    ? `${searchPageLink}${searchPageLink.includes('?') ? '&' : '?'}q=${encodeURIComponent(state.query)}`
    : searchPageLink;
  const resultCount =
    state.query && latestSearchResultCounts.has(state.query)
      ? latestSearchResultCounts.get(state.query)
      : getVisibleResultCount(state);

  return (
    <Link to={searchLink} onClick={closeDocSearch}>
      See all {resultCount} results
    </Link>
  );
}

function createResultCountSearchClient(searchClient: any) {
  return {
    ...searchClient,
    search(requests: any, requestOptions: any) {
      return searchClient.search(requests, requestOptions).then((response: any) => {
        recordSearchResultCounts(requests, response);

        return response;
      });
    },
  };
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
        const storedPosition = readStoredModalPosition();

        if (storedPosition) {
          applyModalPosition(modal, storedPosition);
        }

        modal.dataset.positionReady = 'true';
      }

      const input = modal.querySelector<HTMLInputElement>('.DocSearch-Input');

      if (input && !input.dataset.selectionReady) {
        input.dataset.selectionReady = 'true';
        focusDocSearchInputWithoutMovingCaret(input);
      }

      if (!modal.dataset.focusReady) {
        modal.dataset.focusReady = 'true';

        modal.addEventListener('pointerdown', (event) => {
          const target = event.target as HTMLElement;

          if (
            target.closest('a, button, input, textarea, select') ||
            target.closest('.xqm-docsearch-titlebar')
          ) {
            return;
          }

          event.preventDefault();
          focusDocSearchInput();
        });

        modal.addEventListener('click', (event) => {
          const target = event.target as HTMLElement;

          if (
            target.closest('a, button, input, textarea, select') ||
            target.closest('.xqm-docsearch-titlebar')
          ) {
            return;
          }

          focusDocSearchInput();
        });
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
      queueMicrotask(() => {
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
  // opened but input not focused => focus input
  // opened and input focused => close
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

      if (document.activeElement === input) {
        closeDocSearch();
      } else {
        focusDocSearchInput();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);
}

export default function SearchBar(props: any) {
  const {pathname} = useLocation();

  const scope = useMemo(() => getScopeFromPathname(pathname), [pathname]);
  useDocSearchEnhancer();

  const searchPagePath =
    typeof props.searchPagePath === 'string'
      ? props.searchPagePath
      : DEFAULT_SEARCH_PAGE_PATH;

  const resultsFooterComponent = useMemo(
    () =>
      props.resultsFooterComponent ??
      ((footerProps: {state: StableResultsFooterProps['state']}) => (
        <StableResultsFooter
          state={footerProps.state}
          searchPagePath={searchPagePath}
        />
      )),
    [props.resultsFooterComponent, searchPagePath],
  );

  const filters = useMemo(() => {
    if (!scope) {
      return undefined;
    }

    return `searchScope:"${escapeAlgoliaFilterValue(scope.searchScope)}"`;
  }, [scope]);

  const transformSearchClient = useMemo(
    () => (searchClient: any) => {
      const transformedSearchClient = props.transformSearchClient
        ? props.transformSearchClient(searchClient)
        : searchClient;

      return createResultCountSearchClient(transformedSearchClient);
    },
    [props.transformSearchClient],
  );

  return (
    <OriginalSearchBar
      {...props}
      resultsFooterComponent={resultsFooterComponent}
      transformSearchClient={transformSearchClient}
      searchParameters={{
        ...props.searchParameters,
        ...(filters ? {filters} : {}),
      }}
    />
  );
}
