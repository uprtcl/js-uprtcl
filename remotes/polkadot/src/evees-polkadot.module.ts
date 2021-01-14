import { EveesPolkadotBindings } from './bindings';
import { PolkadotAccountElement } from './provider/account.element';
import { EveesPolkadotCouncilProposal } from './provider/council/council.proposal.element';

export class EveesPolkadotModule extends EveesContentModule {
  static id = 'evees-polkadot-module';
  static bindings = EveesPolkadotBindings;

  logger = new Logger('EVEES-POLKADOT-MODULE');

  async onLoad() {
    customElements.define('evees-polkadot-council-proposal', EveesPolkadotCouncilProposal);
    customElements.define('polkadot-account', PolkadotAccountElement);
  }

  get submodules() {
    return [];
  }
}
