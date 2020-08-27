import { Router } from '@vaadin/router';

export function setupRouter(outlet: HTMLElement) {
  const router = new Router(outlet);

  router.setRoutes([
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      component: 'app-home',
    },
    {
      path: '/doc/:ref',
      component: 'app-doc',
    },
  ]);

  return router;
}
