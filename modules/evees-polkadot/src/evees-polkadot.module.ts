import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesPolkadotBindings } from './bindings';
import { EveesPolkadotCouncilProposal } from './provider/council/proposal.element';
import { EveesPolkadotIdentityRemoteLense } from './provider/identity-based/evees-remote.polkadot-identity.lense';

export class EveesPolkadotModule extends MicroModule {
  static id = 'evees-polkadot-module';
  static bindings = EveesPolkadotBindings;

  logger = new Logger('EVEES-POLKADOT-MODULE');

  async onLoad() {
    customElements.define('evees-polkadot-council-proposal', EveesPolkadotCouncilProposal);
    customElements.define('evees-polkadot-identity-remote', EveesPolkadotIdentityRemoteLense);
  }

  get submodules() {
    return [];
  }
}
