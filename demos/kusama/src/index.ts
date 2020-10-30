import { initUprtcl } from './init-uprtcl';
import { App } from './app';
import { Home } from './pages/home';
import { CouncilSpace } from './pages/council-space';
import { AccountSpace } from './pages/account-space';

(async function() {
  await initUprtcl();

  // customElements.define('layout', RootLayout);
  customElements.define('kusama-intercreativity', App);
  customElements.define('kusama-home', Home);
  customElements.define('council-space', CouncilSpace);
  customElements.define('account-space', AccountSpace);
})();
