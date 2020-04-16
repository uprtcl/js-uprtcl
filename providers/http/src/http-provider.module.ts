import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { HttpEthAuthProviderBindings } from './bindings';
import { HttpEthAuthProvider, HttpRemoteLoginWidget } from './uprtcl-http-provider';

export class HttpProviderModule extends MicroModule {
  static id = 'http-provider-module';

  static bindings = HttpEthAuthProviderBindings;

  async onLoad(container: interfaces.Container): Promise<void> {
    container.bind(HttpProviderModule.bindings.httpEthAuthProvider).to(HttpEthAuthProvider);
    customElements.define('http-eth-auth-widget', HttpRemoteLoginWidget);
  }

  submodules = [];
}
