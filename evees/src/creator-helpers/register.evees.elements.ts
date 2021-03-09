import { EveesPerspectivesList } from '../evees/elements/evees-perspectives-list';
import { EveesInfoPopper } from '../evees/elements/evees-info-popper';

import { EveesDiffExplorer } from '../evees/elements/evees-diff-explorer';
import { EveesAuthor } from '../evees/elements/evees-author';
import { ProposalsList } from '../evees/elements/evees-proposals-list';
import { EveesProposalDiff } from '../evees/elements/evees-proposal-diff';
import { EveesLoginWidget } from '../evees/elements/evees-login';
import { EveesPerspectiveRow } from '../evees/elements/evees-perspective-row';
import { EveesProposalRow } from '../evees/elements/evees-proposal-row';
import { EveesPerspectiveIcon } from '../evees/elements/evees-perspective-icon';
import { EveesDiffUpdate } from '../evees/elements/evees-diff-update';

import { UprtclEntity } from '../patterns/elements/uprtcl-entity';
import { EveesDiffRow } from 'src/evees/elements/evees-diff-row';

export const registerEveesElements = (): void => {
  customElements.define('evees-info-popper', EveesInfoPopper);
  customElements.define('evees-perspectives-list', EveesPerspectivesList);
  customElements.define('evees-proposals-list', ProposalsList);
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
