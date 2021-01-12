import { EveesPerspectivesList } from './elements/evees-perspectives-list';
import { EveesInfoPopper } from './elements/evees-info-popper';

import { EveesInfoPage } from './elements/evees-info-page';
import { EveesDiff } from './elements/evees-diff';
import { EveesAuthor } from './elements/evees-author';
import { ProposalsList } from './elements/evees-proposals-list';
import { EveesProposalDiff } from './elements/evees-proposal-diff';
import { EveesLoginWidget } from './elements/evees-login';
import { EveesPerspectiveRow } from './elements/evees-perspective-row';
import { EveesProposalRow } from './elements/evees-proposal-row';
import { EveesInfoUserBased } from './elements/evees-info-user-based';
import { EveesPerspectiveIcon } from './uprtcl-evees';

export const registerEveesElements = (): void => {
  customElements.define('evees-info-popper', EveesInfoPopper);
  customElements.define('evees-info-page', EveesInfoPage);
  customElements.define('evees-info-user-based', EveesInfoUserBased);
  customElements.define('evees-perspectives-list', EveesPerspectivesList);
  customElements.define('evees-proposals-list', ProposalsList);
  customElements.define('evees-update-diff', EveesDiff);
  customElements.define('evees-proposal-diff', EveesProposalDiff);
  customElements.define('evees-author', EveesAuthor);
  customElements.define('evees-login-widget', EveesLoginWidget);
  customElements.define('evees-perspective-row', EveesPerspectiveRow);
  customElements.define('evees-proposal-row', EveesProposalRow);
  customElements.define('evees-perspective-icon', EveesPerspectiveIcon);
};
