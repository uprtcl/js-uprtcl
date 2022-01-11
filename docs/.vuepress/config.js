const guidesSidebar = [
  '',
  {
    title: 'Evees',
    collapsable: false,
    sidebarDepth: 0,
    children: [
      '/guide/01-core.concepts',
      '/guide/02-perspective-id',
      '/guide/03-linking',
      '/guide/04-querying',
      '/guide/04b-querying-example',
      '/guide/05-forking',
    ],
  },
  {
    title: 'Client',
    collapsable: false,
    sidebarDepth: 0,
    children: [
      '/guide/06-architecture',
      '/guide/07-arquitectue.entities',
      '/guide/08-architecture.detailed',
      '/guide/09-arquitecture.stack',
      '/guide/09b-arquitecture.stack-example',
    ],
  },
];
const resourcesSidebar = ['/resources/videos', '/resources/glossary', '/resources/faq'];

module.exports = {
  title: '_Prtcl',
  description: 'Documentation site for the _Prtcl',
  port: 8081,
  base: '/js-uprtcl/',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]],
  themeConfig: {
    logo: '/logo.png',
    displayAllHeaders: false,
    sidebarDepth: 2,
    sidebar: {
      '/guide/': guidesSidebar,
      '/resources/': resourcesSidebar,
    },
    navbar: true,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Resources', link: '/resources/' },
      { text: 'Github', link: 'https://github.com/uprtcl/js-uprtcl' },
    ],
  },
};
