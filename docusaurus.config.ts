import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const githubEditUrl = 'https://github.com/CraftEngine-Community/xiaoqmi-wiki/edit/main';

type EditUrlParams = {
  versionDocsDirPath: string;
  docPath: string;
};

function getEditUrl({versionDocsDirPath, docPath}: EditUrlParams) {
  return `${githubEditUrl}/${versionDocsDirPath}/${docPath}`;
}

const config: Config = {
  title: "XiaoQMi's Wiki",
  tagline: 'All-in-One Wiki for Everyone',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    faster: {
      rspackBundler: false,
      rspackPersistentCache: false,
    },
  },

  clientModules: [
    require.resolve('./src/clientModules/mouseTrail.ts'),
    require.resolve('./src/clientModules/sidebarEnhancements.ts'),
  ],

  // Set the production url of your site here
  url: 'https://wiki.xiaoqmi.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'CraftEngine-Community', // Usually your GitHub org/user name.
  projectName: 'xiaoqmi-wiki', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: [
            './src/css/custom.css',
            './src/css/searchBar.css',
            './src/css/sidebarEnhancements.css',
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // We may need a social card in future, but as of now it is much faster to not have one.
    // image: 'img/xxx.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "XiaoQMi's Wiki",
      logo: {
        alt: 'XiaoQMi Wiki Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          label: "Projects",
          position: 'left',
          items: [
            {
              label: 'CE Extension',
              to: '/projects/ce-extension/',
            },
          ],
        },
        {
          label: "Tutorials",
          position: 'left',
          items: [
            {
              label: 'CraftEngine',
              to: '/tutorials/craftengine/',
            },
          ],
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/CraftEngine-Community/xiaoqmi-wiki',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Projects',
          items: [
            {
              label: 'CE Extension',
              to: '/projects/ce-extension/',
            },
          ],
        },
        {
          title: 'Tutorials',
          items: [
            {
              label: 'CraftEngine',
              to: '/tutorials/craftengine/',
            },
          ],

        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.com/invite/xiaomomi',
            },
            {
              label: 'Github',
              href: 'https://github.com/CraftEngine-Community/xiaoqmi-ce-extension',
            },
          ],
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} XiaoQMi's Wiki.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    metadata: [
      {
        name: 'algolia-site-verification',
        content: '73FFEDDD2608538D',
      },
    ],
    docsearch: {
      appId: 'KXGC5V582F',
      apiKey: 'c93205c7effd9f6cd9d50c77f8195fa2',
      indexName: 'XiaoCrawler',
      askAi: {
        assistantId: 'f82569a2-f3a8-4aaa-a5a4-dc3a0634f12a',
        agentStudio: true,
        sidePanel: true,
      },
      contextualSearch: true,

      // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      //externalUrlRegex: 'external\\.com|domain\\.com',

      // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
      //replaceSearchResultPathname: {
      //  from: '/docs/', // or as RegExp: /\/docs\//
      //  to: '/',
      //},

      // Optional: Algolia search parameters
      //searchParameters: {},

      // Optional: path for search page that enabled by default (`false` to disable it)
      //searchPagePath: 'search',

      // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      //insights: false,

      // Optional: whether you want to use the new Ask AI feature (undefined by default)
      //askAi: 'YOUR_ALGOLIA_ASK_AI_ASSISTANT_ID',
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
  require.resolve('@docsearch/docusaurus-adapter'),
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'projects_ce-extension',
      path: 'projects/ce-extension',
      routeBasePath: 'projects/ce-extension',
      sidebarPath: './projects/ce-extension/sidebars.ts',
      editUrl: getEditUrl,
      showLastUpdateAuthor: true,
      showLastUpdateTime: true,
    }
  ],
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'tutorials_craftengine',
      path: 'tutorials/craftengine',
      routeBasePath: 'tutorials/craftengine',
      sidebarPath: './tutorials/craftengine/sidebars.ts',
      editUrl: getEditUrl,
      showLastUpdateAuthor: true,
      showLastUpdateTime: true,
    },
  ],
],
};

export default config;
