import { EveesContentModule } from '@uprtcl/evees';
import { EveesAccessControlHttpLense } from './provider/evees-acl.http.lense';

export class EveesHttpModule implements EveesContentModule {
  static id = 'evees-http-module';

  async registerComponents() {
    customElements.define('evees-http-permissions', EveesAccessControlHttpLense);
  }
}
