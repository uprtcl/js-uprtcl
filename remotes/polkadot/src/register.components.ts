import { PolkadotAccountElement } from './provider/account.element';
import { EveesPolkadotCouncilProposal } from './provider/council/council.proposal.element';

export const registerComponents = () => {
  customElements.define('evees-polkadot-council-proposal', EveesPolkadotCouncilProposal);
  customElements.define('polkadot-account', PolkadotAccountElement);
};
