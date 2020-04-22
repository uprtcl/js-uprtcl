const guidesSidebar = [
  ['/guides/', 'Introduction'],
  {
    title: 'Using MicroModules',
    collapsable: true,
    children: ['/guides/use/installing-the-micro-orchestrator', '/guides/use/loading-micro-modules']
  },
  '/guides/using-the-evees-module',
  '/guides/developing-micro-modules',
  {
    title: 'Developing Cortex modules',
    collapsable: true,
    children: [
      '/guides/cortex/what-is-cortex',
      '/guides/cortex/loading-cortex',
      {
        title: 'Building blocks',
        collapsable: true,
        children: [
          '/guides/cortex/building-blocks/patterns',
          '/guides/cortex/building-blocks/lenses',
          '/guides/cortex/building-blocks/cas-sources',
          '/guides/cortex/building-blocks/graphql-schemas'
        ]
      },
      '/guides/cortex/loading-building-blocks',
      '/guides/cortex/using-the-pattern-recognizer'
    ]
  }
];

const modulesSidebar = [
  ['', 'Overview'],
  '/modules/uprtcl-micro-orchestrator',
  {
    title: 'Bootstrap Modules',
    collapsable: false,
    children: [
      '/modules/modules/uprtcl-access-control',
      '/modules/modules/uprtcl-evees',
      '/modules/modules/uprtcl-documents',
      '/modules/modules/uprtcl-wikis'
    ]
  },
  {
    title: 'Backend Providers',
    collapsable: false,
    children: [
      '/modules/providers/uprtcl-http-provider',
      '/modules/providers/uprtcl-ethereum-provider',
      '/modules/providers/uprtcl-ipfs-provider',
      '/modules/providers/uprtcl-holochain-provider'
    ]
  },
  {
    title: 'Infrastructure',
    collapsable: false,
    children: [
      '/modules/packages/uprtcl-graphql',
      '/modules/packages/uprtcl-cortex',
      '/modules/packages/uprtcl-multiplatform',
      '/modules/packages/uprtcl-lenses'
    ]
  },
  '/modules/other-modules'
];

const resourcesSidebar = ['/resources/videos', '/resources/glossary', '/resources/faq'];

module.exports = {
  title: 'The Underscore Protocol',
  description: 'Documentation site for the _Prtcl',
  port: 8081,
  base: '/js-uprtcl/',
  head: [
    [
      'link',
      { rel: 'icon', type: 'image/png', href: '/favicon.png' }
    ]
  ],
  themeConfig: {
    logo: '/logo.png',
    displayAllHeaders: false,
    sidebarDepth: 2,
    sidebar: {
      '/guides/': guidesSidebar,
      '/modules/': modulesSidebar,
      '/resources/': resourcesSidebar
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guides', link: '/guides/' },
      { text: 'Modules', link: '/modules/' },
      { text: 'Resources', link: '/resources/' },
      { text: 'Github', link: 'https://github.com/uprtcl/js-uprtcl' }
    ]
  }
};
