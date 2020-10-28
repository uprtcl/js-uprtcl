import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesPolkadotBindings } from './bindings';
import { EveesPolkadotCouncilProposal } from './provider/council/council.proposal.element';

export class EveesPolkadotModule extends MicroModule {
  static id = 'evees-polkadot-module';
  static bindings = EveesPolkadotBindings;

  logger = new Logger('EVEES-POLKADOT-MODULE');

  async onLoad() {
    customElements.define('evees-polkadot-council-proposal', EveesPolkadotCouncilProposal);
  }

  get submodules() {
    return [];
  }
}
