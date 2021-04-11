import { EveesPerspectivesList } from './evees-perspectives-list';
import { EveesInfoPopper } from './evees-info-popper';

import { EveesDiffExplorer } from './evees-diff-explorer';
import { EveesAuthor } from './evees-author';
import { ProposalsList } from './evees-proposals-list';
import { EveesProposalDiff } from './evees-proposal-diff';
import { EveesLoginWidget } from './evees-login';
import { EveesPerspectiveRow } from './evees-perspective-row';
import { EveesProposalRow } from './evees-proposal-row';
import { EveesPerspectiveIcon } from './evees-perspective-icon';
import { EveesDiffUpdate } from './evees-diff-update';

import { UprtclEntity } from './uprtcl-entity';
import { EveesDiffRow } from 'src/evees/elements/evees-diff-row';
import { ProposalsDropdown } from './evees-proposals-dropdown';

export const registerEveesElements = (): void => {
  customElements.define('evees-info-popper', EveesInfoPopper);
  customElements.define('evees-perspectives-list', EveesPerspectivesList);
  customElements.define('evees-proposals-list', ProposalsList);
  customElements.define('evees-proposals-dropdown', ProposalsDropdown);
  customElements.define('evees-diff-explorer', EveesDiffExplorer);
  customElements.define('evees-diff-update', EveesDiffUpdate);
  customElements.define('evees-diff-row', EveesDiffRow);
  customElements.define('evees-proposal-diff', EveesProposalDiff);
  customElements.define('evees-author', EveesAuthor);
  customElements.define('evees-login-widget', EveesLoginWidget);
  customElements.define('evees-perspective-row', EveesPerspectiveRow);
  customElements.define('evees-proposal-row', EveesProposalRow);
  customElements.define('evees-perspective-icon', EveesPerspectiveIcon);

  customElements.define('uprtcl-entity', UprtclEntity);
};
