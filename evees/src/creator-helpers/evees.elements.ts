import { EveesPerspectivesList } from '../evees/elements/evees-perspectives-list';
import { EveesInfoPopper } from '../evees/elements/evees-info-popper';

import { EveesInfoPage } from '../evees/elements/evees-info-page';
import { EveesDiff } from '../evees/elements/evees-diff';
import { EveesAuthor } from '../evees/elements/evees-author';
import { ProposalsList } from '../evees/elements/evees-proposals-list';
import { EveesProposalDiff } from '../evees/elements/evees-proposal-diff';
import { EveesLoginWidget } from '../evees/elements/evees-login';
import { EveesPerspectiveRow } from '../evees/elements/evees-perspective-row';
import { EveesProposalRow } from '../evees/elements/evees-proposal-row';
import { EveesInfoUserBased } from '../evees/elements/evees-info-user-based';
import { EveesPerspectiveIcon } from '../evees/elements/evees-perspective-icon';

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
