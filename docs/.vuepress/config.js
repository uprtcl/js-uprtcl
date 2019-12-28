let micro = require('../packages/micro-orchestrator/api/sidebar.json');
micro = micro
  .filter(ele => !ele.title.includes('Modules'))
  .map(arr => ({
    ...arr,
    children: arr.children.map(child => '/packages/micro-orchestrator/api/' + child)
  }));

const guideSidebar = [
  ['/', 'Home'],
  ['/guide/', 'Introduction']
];

module.exports = {
  title: '_Prtcl',
  description: 'Documentation site for the _Prtcl',
  port: 8081,
  themeConfig: {
    logo: '/logo.png',
    displayAllHeaders: false,
    sidebarDepth: 2,
    sidebar: {
      '/guide/': guideSidebar,
      '/packages/': [
        ['', 'Home'],
        {
          title: '@uprtcl/micro-orchestrator',
          collapsable: true,
          children: [{ title: 'API reference', collapsable: true, children: micro }]
        }
      ]
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Packages', link: '/packages/' },
      { text: 'Modules', link: '/modules/' },
      { text: 'Github', link: 'https://github.com/uprtcl/js-uprtcl' }
    ]
  }
};
