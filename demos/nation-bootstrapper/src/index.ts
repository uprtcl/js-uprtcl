import { New } from './new';
import { Nation } from './nation';
import { initUprtcl } from './init';
import { App } from './app';

(async function () {
  await initUprtcl();

  customElements.define('nation-bootstrapper', App);
  customElements.define('nation-new', New);
  customElements.define('nation-home', Nation);
})();
