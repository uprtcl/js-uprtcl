import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesEthereumBindings } from './bindings';
import { ThreeBoxProfile } from './provider/threebox/threebox.profile';

export class EveesEthereumModule extends MicroModule {
  static id = 'evees-ethereum-module';
  static bindings = EveesEthereumBindings;

  logger = new Logger('EVEES-ETHEREUM-MODULE');

  async onLoad() {
    customElements.define('threebox-profile', ThreeBoxProfile);
  }

  get submodules() {
    return [];
  }
}
