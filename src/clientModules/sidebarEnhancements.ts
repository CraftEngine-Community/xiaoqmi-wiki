export {};

type AccentOption = {
  name: string;
  value: string;
};

type FontOption = {
  name: string;
  value: string;
  sample: string;
  family: string;
};

const FONT_STORAGE_KEY = 'xqm-doc-font';
const ACCENT_STORAGE_KEY = 'xqm-accent-color';
const SELECTED_ITEM_CLASS = 'xqm-sidebar-selected';
const OPEN_MENU_CLASS = 'xqm-sidebar-menu-open';
const SCROLLING_CLASS = 'xqm-sidebar-scrolling';
const SIDEBAR_SHELL_CLASS = 'xqm-sidebar-shell';
const KEY_ACTIVE_CLASS = 'xqm-sidebar-key-active';
const KEY_FADING_CLASS = 'xqm-sidebar-key-fading';

let selectedItemKey: string | null = null;

const ACCENT_OPTIONS: AccentOption[] = [
  {name: 'Sky', value: '#4da3ff'},
  {name: 'Violet', value: '#9b7cff'},
  {name: 'Mint', value: '#25c2a0'},
  {name: 'Rose', value: '#ff6b91'},
  {name: 'Amber', value: '#f6b64b'},
];

const FONT_OPTIONS: FontOption[] = [
  {
    name: 'System',
    value: 'system',
    sample: 'Aa',
    family: 'system-ui, -apple-system, Segoe UI, sans-serif',
  },
  {
    name: 'Clean Sans',
    value: 'clean-sans',
    sample: 'Aa',
    family: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  },
  {
    name: 'Serif',
    value: 'serif',
    sample: 'Aa',
    family: 'Georgia, Times New Roman, serif',
  },
  {
    name: 'Mono',
    value: 'mono',
    sample: 'Aa',
    family: 'var(--ifm-font-family-monospace)',
  },
  {
    name: 'Reading',
    value: 'reading',
    sample: 'Aa',
    family: 'Atkinson Hyperlegible, Verdana, Arial, sans-serif',
  },
];

const ICONS = {
  expand:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H4v4"/><path d="M4 3l6 6"/><path d="M16 3h4v4"/><path d="M20 3l-6 6"/><path d="M8 21H4v-4"/><path d="M4 21l6-6"/><path d="M16 21h4v-4"/><path d="M20 21l-6-6"/></svg>',
  collapse:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4v6H4"/><path d="M4 10l6-6"/><path d="M14 4v6h6"/><path d="M20 10l-6-6"/><path d="M10 20v-6H4"/><path d="M4 14l6 6"/><path d="M14 20v-6h6"/><path d="M20 14l-6 6"/></svg>',
  palette:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18h1.5a1.8 1.8 0 0 0 .7-3.46 1.6 1.6 0 0 1 .6-3.08H16a5 5 0 0 0 0-10 8.8 8.8 0 0 0-4-1.46Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="14" cy="8" r="1"/><circle cx="9" cy="13" r="1"/></svg>',
  font:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6V4h16v2"/><path d="M12 4v16"/><path d="M8 20h8"/></svg>',
};

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Current session styling still works if storage is unavailable.
  }
}

function getStoredFont() {
  const stored = readStoredValue(FONT_STORAGE_KEY);

  if (FONT_OPTIONS.some((font) => font.value === stored)) {
    return stored as string;
  }

  return FONT_OPTIONS[0].value;
}

function getStoredAccent() {
  const stored = readStoredValue(ACCENT_STORAGE_KEY);

  if (ACCENT_OPTIONS.some((accent) => accent.value === stored)) {
    return stored as string;
  }

  return ACCENT_OPTIONS[0].value;
}

function applyFont(font: string) {
  const option = FONT_OPTIONS.find((item) => item.value === font) ?? FONT_OPTIONS[0];

  document.documentElement.dataset.xqmDocFont = option.value;
  document.documentElement.style.setProperty('--xqm-doc-font-family', option.family);
}

function applyAccent(accent: string) {
  document.documentElement.style.setProperty('--xqm-accent', accent);
  document.documentElement.style.setProperty('--ifm-color-primary', accent);
  document.documentElement.style.setProperty('--docsearch-primary-color', accent);
  document.documentElement.style.setProperty('--docsearch-highlight-color', accent);
}

function getDesktopSidebarNavs() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      'nav.menu.thin-scrollbar:has(.theme-doc-sidebar-menu)',
    ),
  );
}

function getCategoryToggle(item: Element) {
  return item.querySelector<HTMLElement>(
    ':scope > .menu__list-item-collapsible > .menu__caret, :scope > .menu__list-item-collapsible > .menu__link[role="button"]',
  );
}

function getCategoryHeader(item: Element) {
  return item.querySelector<HTMLElement>(
    ':scope > .menu__list-item-collapsible > .menu__link',
  );
}

function getItemLink(item: Element) {
  return item.querySelector<HTMLElement>(':scope > .menu__link[href]');
}

function isCollapsed(category: Element) {
  return category.classList.contains('menu__list-item--collapsed');
}

function setCategoryExpanded(category: Element, expanded: boolean) {
  if (expanded === isCollapsed(category)) {
    getCategoryToggle(category)?.click();
  }
}

function setAllCategories(nav: HTMLElement, expanded: boolean) {
  const selectTopPage = () => {
    const topPage = getVisibleSidebarItems().find((item) => getItemLink(item));

    selectItem(topPage ?? getVisibleSidebarItems()[0]);
  };

  if (!expanded) {
    const targets = Array.from(
      nav.querySelectorAll<HTMLElement>('.theme-doc-sidebar-item-category'),
    ).filter((item) => !isCollapsed(item));

    targets.forEach((item) => setCategoryExpanded(item, false));

    window.requestAnimationFrame(selectTopPage);
    return;
  }

  let pass = 0;
  const expandNextPass = () => {
    const targets = Array.from(
      nav.querySelectorAll<HTMLElement>('.theme-doc-sidebar-item-category'),
    ).filter((item) => isCollapsed(item));

    if (targets.length === 0 || pass >= 24) {
      selectTopPage();
      return;
    }

    pass += 1;
    targets.forEach((item) => setCategoryExpanded(item, true));
    window.requestAnimationFrame(expandNextPass);
  };

  expandNextPass();
}

function createToolButton(
  className: string,
  icon: string,
  title: string,
  onClick: (button: HTMLButtonElement) => void,
) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `xqm-sidebar-tool ${className}`;
  button.innerHTML = icon;
  button.title = title;
  button.setAttribute('aria-label', title);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick(button);
  });

  return button;
}

function closeOpenMenus(except?: HTMLElement) {
  document
    .querySelectorAll<HTMLElement>(`.${OPEN_MENU_CLASS}`)
    .forEach((menuHost) => {
      if (menuHost !== except) {
        menuHost.classList.remove(OPEN_MENU_CLASS);
      }
    });
}

function createChoiceMenu(className: string) {
  const menu = document.createElement('div');
  menu.className = `xqm-sidebar-popover ${className}`;

  return menu;
}

function updateMenuSelections() {
  const accent = getStoredAccent();
  const font = getStoredFont();
  const fontOption = FONT_OPTIONS.find((item) => item.value === font) ?? FONT_OPTIONS[0];

  document
    .querySelectorAll<HTMLButtonElement>('.xqm-sidebar-color-choice')
    .forEach((button) => {
      button.dataset.selected = button.dataset.value === accent ? 'true' : 'false';
    });

  document
    .querySelectorAll<HTMLButtonElement>('.xqm-sidebar-font-choice')
    .forEach((button) => {
      button.dataset.selected = button.dataset.value === font ? 'true' : 'false';
    });

  document
    .querySelectorAll<HTMLButtonElement>('.xqm-sidebar-tool-font')
    .forEach((button) => {
      const label = `Font: ${fontOption.name}`;

      button.title = label;
      button.setAttribute('aria-label', label);
    });
}

function createAccentMenu() {
  const menu = createChoiceMenu('xqm-sidebar-color-menu');

  ACCENT_OPTIONS.forEach((accent) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'xqm-sidebar-color-choice';
    button.dataset.value = accent.value;
    button.title = accent.name;
    button.setAttribute('aria-label', accent.name);
    button.style.setProperty('--choice-color', accent.value);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      writeStoredValue(ACCENT_STORAGE_KEY, accent.value);
      applyAccent(accent.value);
      updateMenuSelections();
    });

    menu.appendChild(button);
  });

  return menu;
}

function createFontMenu() {
  const menu = createChoiceMenu('xqm-sidebar-font-menu');

  FONT_OPTIONS.forEach((font) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'xqm-sidebar-font-choice';
    button.dataset.value = font.value;
    button.title = `Font: ${font.name}`;
    button.textContent = font.sample;
    button.style.fontFamily = font.family;
    button.setAttribute('aria-label', `Font: ${font.name}`);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      writeStoredValue(FONT_STORAGE_KEY, font.value);
      applyFont(font.value);
      updateMenuSelections();
    });

    menu.appendChild(button);
  });

  return menu;
}

function createMenuHost(button: HTMLButtonElement, menu: HTMLElement) {
  const host = document.createElement('div');
  host.className = 'xqm-sidebar-tool-menu-host';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !host.classList.contains(OPEN_MENU_CLASS);

    closeOpenMenus(host);
    host.classList.toggle(OPEN_MENU_CLASS, willOpen);
  });
  host.append(button, menu);

  return host;
}

function createToolbar(nav: HTMLElement) {
  const toolbar = document.createElement('div');
  toolbar.className = 'xqm-sidebar-toolbar';

  const expandButton = createToolButton(
    'xqm-sidebar-tool-expand',
    ICONS.expand,
    'Expand all',
    () => setAllCategories(nav, true),
  );
  const collapseButton = createToolButton(
    'xqm-sidebar-tool-collapse',
    ICONS.collapse,
    'Collapse all',
    () => setAllCategories(nav, false),
  );
  const spacer = document.createElement('span');
  spacer.className = 'xqm-sidebar-toolbar-spacer';
  const accentButton = createToolButton(
    'xqm-sidebar-tool-accent',
    ICONS.palette,
    'Theme Color',
    () => undefined,
  );
  const fontButton = createToolButton(
    'xqm-sidebar-tool-font',
    ICONS.font,
    'Font:',
    () => undefined,
  );

  toolbar.append(
    expandButton,
    collapseButton,
    spacer,
    createMenuHost(accentButton, createAccentMenu()),
    createMenuHost(fontButton, createFontMenu()),
  );
  updateMenuSelections();

  return toolbar;
}

function createShortcutPanel() {
  const panel = document.createElement('div');
  panel.className = 'xqm-sidebar-shortcuts';
  panel.innerHTML = [
    '<span><kbd>Ctrl</kbd><kbd>Up</kbd>/<kbd>Down</kbd> select</span>',
    '<span><kbd>Ctrl</kbd><kbd>Left</kbd>/<kbd>Right</kbd> folder</span>',
    '<span><kbd>Ctrl</kbd><kbd>Enter</kbd> open</span>',
  ].join('');

  return panel;
}

function getItemControl(item: Element) {
  return (
    getCategoryHeader(item) ??
    getItemLink(item)
  );
}

function getItemLabel(item: Element) {
  return getItemControl(item)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

function getItemKey(item: Element) {
  const link = getItemLink(item);

  if (link) {
    return `link:${link.getAttribute('href') ?? link.textContent ?? ''}`;
  }

  const labels = Array.from(
    item
      .parentElement
      ?.closest<HTMLElement>('.theme-doc-sidebar-item-category')
      ?.querySelectorAll<HTMLElement>(
        ':scope > .menu__list-item-collapsible > .menu__link',
      ) ?? [],
  )
    .map((control) => control.textContent?.trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  labels.push(getItemLabel(item));

  return `category:${labels.join(' / ')}`;
}

function findItemByKey(key: string | null) {
  if (!key) {
    return null;
  }

  return (
    getVisibleSidebarItems().find((item) => getItemKey(item) === key) ?? null
  );
}

function getVisibleSidebarItems() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '.xqm-sidebar-enhanced .theme-doc-sidebar-menu .menu__list-item',
    ),
  ).filter((item) => {
    const control = getItemControl(item);
    const rect = control?.getBoundingClientRect();

    return Boolean(
      control &&
        rect &&
        rect.width > 0 &&
        rect.height > 0 &&
        !item.closest('.menu__list-item--collapsed .menu__list'),
    );
  });
}

function clearSelectedItem() {
  document
    .querySelectorAll(`.${SELECTED_ITEM_CLASS}`)
    .forEach((item) => item.classList.remove(SELECTED_ITEM_CLASS));
}

function selectItem(item: HTMLElement | null | undefined) {
  if (!item) {
    return;
  }

  selectedItemKey = getItemKey(item);
  clearSelectedItem();
  item.classList.add(SELECTED_ITEM_CLASS);

  const control = getItemControl(item);
  const scroller = item.closest<HTMLElement>('.theme-doc-sidebar-menu');

  if (!control || !scroller) {
    item.scrollIntoView({block: 'nearest'});
    return;
  }

  const controlRect = control.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();

  if (controlRect.top < scrollerRect.top) {
    scroller.scrollTop -= scrollerRect.top - controlRect.top + 8;
  } else if (controlRect.bottom > scrollerRect.bottom) {
    scroller.scrollTop += controlRect.bottom - scrollerRect.bottom + 8;
  }
}

function restoreSelectedItem() {
  const selected = findItemByKey(selectedItemKey);

  if (!selected) {
    return;
  }

  clearSelectedItem();
  selected.classList.add(SELECTED_ITEM_CLASS);
}

function selectActiveItem(nav: HTMLElement) {
  const activeItem = nav
    .querySelector<HTMLElement>('.menu__link--active')
    ?.closest<HTMLElement>('.menu__list-item');

  if (!activeItem) {
    return;
  }

  selectedItemKey = getItemKey(activeItem);
  clearSelectedItem();
  activeItem.classList.add(SELECTED_ITEM_CLASS);
}

let keyFadeTimer: number | undefined;

function getEnhancedSidebarNavs() {
  return Array.from(document.querySelectorAll<HTMLElement>('.xqm-sidebar-enhanced'));
}

function showKeyboardSelection() {
  if (keyFadeTimer) {
    window.clearTimeout(keyFadeTimer);
  }

  getEnhancedSidebarNavs().forEach((nav) => {
    nav.classList.add(KEY_ACTIVE_CLASS);
    nav.classList.remove(KEY_FADING_CLASS);
  });
}

function fadeKeyboardSelection() {
  getEnhancedSidebarNavs().forEach((nav) => {
    nav.classList.remove(KEY_ACTIVE_CLASS);
    nav.classList.add(KEY_FADING_CLASS);
  });

  if (keyFadeTimer) {
    window.clearTimeout(keyFadeTimer);
  }

  keyFadeTimer = window.setTimeout(() => {
    getEnhancedSidebarNavs().forEach((nav) => {
      nav.classList.remove(KEY_FADING_CLASS);
    });
  }, 1000);
}

function getSelectedItem() {
  const selectedByClass = document.querySelector<HTMLElement>(
    `.${SELECTED_ITEM_CLASS}`,
  );

  if (selectedByClass?.isConnected) {
    return selectedByClass;
  }

  const selectedByKey = findItemByKey(selectedItemKey);

  if (selectedByKey) {
    selectedByKey.classList.add(SELECTED_ITEM_CLASS);
    return selectedByKey;
  }

  return (
    document
      .querySelector<HTMLElement>('.xqm-sidebar-enhanced .menu__link--active')
      ?.closest<HTMLElement>('.menu__list-item') ??
    getVisibleSidebarItems()[0] ??
    null
  );
}

function getSelectedIndex(items: HTMLElement[]) {
  const selected = getSelectedItem();
  const index = selected ? items.indexOf(selected) : -1;

  return index >= 0 ? index : 0;
}

function selectRelativeItem(direction: 1 | -1) {
  const items = getVisibleSidebarItems();

  if (items.length === 0) {
    return;
  }

  const currentIndex = getSelectedIndex(items);
  const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + direction));

  selectItem(items[nextIndex]);
}

function getDirectChildCategories(category: HTMLElement) {
  return Array.from(
    category.querySelectorAll<HTMLElement>(
      ':scope > .menu__list > .theme-doc-sidebar-item-category',
    ),
  );
}

function getParentCategory(item: HTMLElement | null) {
  return (
    item
      ?.parentElement
      ?.closest<HTMLElement>('.theme-doc-sidebar-item-category') ?? null
  );
}

function toggleCategory(category: HTMLElement) {
  const key = getItemKey(category);

  getCategoryToggle(category)?.click();
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  selectedItemKey = key;

  window.requestAnimationFrame(() => {
    restoreSelectedItem();
  });
}

function navigateSelectionLeft() {
  const selected = getSelectedItem();
  const selectedCategory = selected?.matches('.theme-doc-sidebar-item-category')
    ? selected
    : null;

  if (selectedCategory && !isCollapsed(selectedCategory)) {
    toggleCategory(selectedCategory);
    return;
  }

  const parent = getParentCategory(selected);

  if (parent) {
    toggleCategory(parent);
    selectItem(parent);
  }
}

function navigateSelectionRight() {
  const selected = getSelectedItem();
  const selectedCategory = selected?.matches('.theme-doc-sidebar-item-category')
    ? selected
    : null;

  if (!selectedCategory) {
    return;
  }

  if (isCollapsed(selectedCategory)) {
    toggleCategory(selectedCategory);
    return;
  }

  selectItem(getDirectChildCategories(selectedCategory)[0]);
}

function openSelectedItem() {
  const selected = getSelectedItem();
  const link = selected ? getItemLink(selected) : null;

  if (link) {
    link.click();
    return;
  }

  const selectedCategory = selected?.matches('.theme-doc-sidebar-item-category')
    ? selected
    : null;

  if (selectedCategory) {
    toggleCategory(selectedCategory);
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], .DocSearch-Modal',
    ),
  );
}

function syncInitialSelection(nav: HTMLElement) {
  if (nav.querySelector(`.${SELECTED_ITEM_CLASS}`)) {
    return;
  }

  restoreSelectedItem();

  if (!nav.querySelector(`.${SELECTED_ITEM_CLASS}`)) {
    selectActiveItem(nav);
  }
}

function setupSidebarScroller(list: Element) {
  const listElement = list as HTMLElement;

  if (listElement.dataset.xqmSidebarScroller) {
    return;
  }

  listElement.dataset.xqmSidebarScroller = 'true';

  let hideScrollbarTimer: number | undefined;

  const showScrollbar = () => {
    listElement.classList.add(SCROLLING_CLASS);

    if (hideScrollbarTimer) {
      window.clearTimeout(hideScrollbarTimer);
    }

    hideScrollbarTimer = window.setTimeout(() => {
      listElement.classList.remove(SCROLLING_CLASS);
    }, 1100);
  };

  listElement.addEventListener('scroll', showScrollbar, {passive: true});
  listElement.addEventListener('wheel', showScrollbar, {passive: true});
  listElement.addEventListener('pointerenter', () => {
    if (listElement.scrollHeight > listElement.clientHeight) {
      showScrollbar();
    }
  });
  listElement.addEventListener('pointerleave', () => {
    if (hideScrollbarTimer) {
      window.clearTimeout(hideScrollbarTimer);
    }

    hideScrollbarTimer = window.setTimeout(() => {
      listElement.classList.remove(SCROLLING_CLASS);
    }, 450);
  });
}

function markSidebarShell(nav: HTMLElement) {
  const shell =
    nav.closest<HTMLElement>('.theme-doc-sidebar-container, aside') ??
    nav.parentElement;

  shell?.classList.add(SIDEBAR_SHELL_CLASS);
}

function enhanceSidebar(nav: HTMLElement) {
  if (!nav.dataset.xqmSidebarEnhanced) {
    nav.dataset.xqmSidebarEnhanced = 'true';
    nav.classList.add('xqm-sidebar-enhanced');
    markSidebarShell(nav);

    const list = nav.querySelector('.theme-doc-sidebar-menu');

    if (list) {
      nav.insertBefore(createToolbar(nav), list);
      nav.appendChild(createShortcutPanel());
      setupSidebarScroller(list);
    }
  }

  syncInitialSelection(nav);
}

function setupKeyboardNavigation() {
  document.addEventListener('keydown', (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    if (event.key === 'Control' && !event.altKey && !event.metaKey && !event.shiftKey) {
      showKeyboardSelection();
      return;
    }

    if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      return;
    }

    if (
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(
        event.key,
      )
    ) {
      return;
    }

    event.preventDefault();
    showKeyboardSelection();

    if (event.key === 'ArrowUp') {
      selectRelativeItem(-1);
      return;
    }

    if (event.key === 'ArrowDown') {
      selectRelativeItem(1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      navigateSelectionLeft();
      return;
    }

    if (event.key === 'ArrowRight') {
      navigateSelectionRight();
      return;
    }

    openSelectedItem();
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'Control') {
      fadeKeyboardSelection();
    }
  });

  window.addEventListener('blur', fadeKeyboardSelection);

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    if (!target.closest('.xqm-sidebar-tool-menu-host')) {
      closeOpenMenus();
    }

    const item = target.closest<HTMLElement>('.xqm-sidebar-enhanced .menu__list-item');

    if (item && getItemControl(item)) {
      selectItem(item);
    }
  });
}

function enhanceSidebars() {
  getDesktopSidebarNavs().forEach(enhanceSidebar);
}

if (typeof window !== 'undefined') {
  applyFont(getStoredFont());
  applyAccent(getStoredAccent());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceSidebars);
  } else {
    enhanceSidebars();
  }

  setupKeyboardNavigation();

  const observer = new MutationObserver(enhanceSidebars);
  observer.observe(document.body, {childList: true, subtree: true});
}
