import React, {useMemo, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import * as OriginalSearchBarModule from '@theme-original/SearchBar';

const OriginalSearchBar =
  (OriginalSearchBarModule as any).default ?? OriginalSearchBarModule;

type ScopeInfo = {
  project: string;
  contentType: 'project' | 'tutorial';
  searchScope: string;
  label: string;
};

function escapeAlgoliaFilterValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getScopeFromPathname(pathname: string): ScopeInfo | null {
  const parts = pathname.split('/').filter(Boolean);

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
      contentType: 'tutorial',
      searchScope: `tutorial:${project}`,
      label: project,
    };
  }

  if (section === 'projects') {
    return {
      project,
      contentType: 'project',
      searchScope: `project:${project}`,
      label: project,
    };
  }

  return null;
}

export default function SearchBar(props: any) {
  const {pathname} = useLocation();
  const scope = useMemo(() => getScopeFromPathname(pathname), [pathname]);
  const [searchAllProject, setSearchAllProject] = useState(false);

  const filters = useMemo(() => {
    if (!scope) {
      return undefined;
    }

    if (searchAllProject) {
      return `project:"${escapeAlgoliaFilterValue(scope.project)}"`;
    }

    return `searchScope:"${escapeAlgoliaFilterValue(scope.searchScope)}"`;
  }, [scope, searchAllProject]);

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
      <OriginalSearchBar
        {...props}
        searchParameters={{
          ...props.searchParameters,
          ...(filters ? {filters} : {}),
        }}
      />

      {scope && (
        <button
          type="button"
          onClick={() => setSearchAllProject((value) => !value)}
          title={
            searchAllProject
              ? `Only search current ${scope.contentType}`
              : `Search all ${scope.label} content`
          }
          style={{
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: '999px',
            background: 'var(--ifm-background-color)',
            color: 'var(--ifm-font-color-base)',
            padding: '0.35rem 0.65rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {searchAllProject ? 'all' : scope.contentType}
        </button>
      )}
    </div>
  );
}