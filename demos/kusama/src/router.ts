import { Router } from '@vaadin/router';

const router = new Router();

const routes = [
  // { path: '/', component: 'kusama-home' },
  {
    path: '/',
    component: 'layout',
    children: [
      { path: '/', component: 'kusama-home' },
      { path: '/council', component: 'council-space' },
      { path: '/account', component: 'account-space' }
    ]
  }
];

export { router, routes };
