import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialsCraftEngine: [
    'index',
    {
      type: 'category',
      label: 'Image',
      link: {
        type: 'doc',
        id: 'image/index',
      },
      items: [
        {
          'Definition': [
            'image/definition/how-is-image-defined/index',
          ]
        }
      ],
    }
  ],
};

export default sidebars;
