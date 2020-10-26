import { Home } from './home';
import { Doc } from './doc';
import { initUprtcl } from './init';
import { App } from './app';

(async function () {
  await initUprtcl();

  customElements.define('kusama-app', App);
  customElements.define('kusama-home', Home);
  // customElements.define('council-space', KusamaSpace);
  // customElements.define('account-space', AccountSpace);
})();
