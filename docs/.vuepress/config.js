const guidesSidebar = [
  ['/guides/', 'Introduction'],
  {
    title: 'Using MicroModules',
    collapsable: true,
    children: [
      '/guides/use/installing-the-micro-orchestrator',
      '/guides/use/loading-micro-modules'
    ]
  },
  {
    title: 'Using the Evees module',
    collapsable: true,
    children: ['/guides/evees/using-the-evees-module']
  },
  {
    title: 'Developing a MicroModule',
    collapsable: true,
    children: ['/guides/develop/developing-micro-modules']
  },
  {
    title: 'Developing Cortex modules',
    collapsable: true,
    children: [
      '/guides/cortex/what-is-cortex',
      '/guides/cortex/what-does-cortex-enable',
      {
        title: 'Building blocks',
        collapsable: true,
        children: [
          '/guides/cortex/building-blocks/patterns',
          '/guides/cortex/building-blocks/lenses'
        ]
      }
    ]
  }
];

const modulesSidebar = [
  ['', 'Overview'],
  '/modules/uprtcl-micro-orchestrator',
  {
    title: 'Bootstrap Modules',
    collapsable: true,
    children: [
      '/modules/modules/uprtcl-access-control',
      '/modules/modules/uprtcl-evees',
      '/modules/modules/uprtcl-documents',
      '/modules/modules/uprtcl-wikis'
    ]
  },
  {
    title: 'Backend Providers',
    collapsable: true,
    children: [
      '/modules/providers/uprtcl-http-provider',
      '/modules/providers/uprtcl-ethereum-provider',
      '/modules/providers/uprtcl-ipfs-provider',
      '/modules/providers/uprtcl-holochain-provider'
    ]
  },
  {
    title: 'Infrastructure',
    collapsable: true,
    children: [
      '/modules/packages/uprtcl-graphql',
      '/modules/packages/uprtcl-cortex',
      '/modules/packages/uprtcl-multiplatform',
      '/modules/packages/uprtcl-lenses'
    ]
  },
  '/modules/other-modules'
];

const resourcesSidebar = [
  ['https://uprtcl.io', 'Landing page'],
  ['https://github.com/uprtcl/spec', 'Spec'],
  '/resources/videos',
  '/resources/glossary',
  '/resources/faq',
  ['https://t.me/joinchat/F5CuUBQMjbKTxLkWTd_jDg', 'Telegram Devs Group']
];

module.exports = {
  title: '_Prtcl',
  description: 'Documentation site for the _Prtcl',
  port: 8081,
  base: '/js-uprtcl/',
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
