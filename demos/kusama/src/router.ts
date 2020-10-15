import { Router } from '@vaadin/router';

export function setupRouter(outlet: HTMLElement) {
  const router = new Router(outlet);

  router.setRoutes([
    {
      path: '/',
      component: '/kusama-home',
      children: [
        {path: '/council', component: 'council-space'},
        {path: '/account/:accountId', component: 'account-space'},
      ]
    }
  ]);

  return router;
}
