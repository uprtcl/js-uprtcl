import { Home } from './home';
import { Doc } from './doc';
import { initUprtcl } from './init';
import { App } from './app';

(async function () {
  await initUprtcl();

  customElements.define('intercreativity-app', App);
  customElements.define('app-home', Home);
  customElements.define('app-doc', Doc);
})();
