import { Router } from '@vaadin/router';

export function setupRouter(outlet: HTMLElement) {
  const router = new Router(outlet);

  router.setRoutes([
    {
      path: '/',
      redirect: '/new',
    },
    {
      path: '/new',
      component: 'nation-new',
    },
    {
      path: '/nation/:ref',
      component: 'nation-home',
    },
  ]);

  return router;
}
