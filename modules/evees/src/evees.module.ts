import { interfaces } from 'inversify';

import { MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { CASModule } from '@uprtcl/multiplatform';
import { CommonUIModule } from '@uprtcl/common-ui';

import { PerspectiveLinks, PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern, CommitLinked } from './patterns/commit.pattern';
import { EveesBindings } from './bindings';
import { EveesRemote } from './services/remote';
import { EveesPerspectivesList } from './elements/evees-perspectives-list';
import { EveesInfoPopper } from './elements/evees-info-popper';

import en from './i18n/en.json';
import { EveesConfig } from './types';
import { EveesInfoPage } from './elements/evees-info-page';
import { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
import { EveesDiff } from './elements/evees-diff';
import { EveesAuthor } from './elements/evees-author';
import { ProposalsList } from './elements/evees-proposals-list';
import { EveesProposalDiff } from './elements/evees-proposal-diff';
import { EveesLoginWidget } from './elements/evees-login';
import { EveesPerspectiveRow } from './elements/evees-perspective-row';
import { EveesProposalRow } from './elements/evees-proposal-row';
import { EveesInfoUserBased } from './elements/evees-info-user-based';
import { EveesPerspectiveIcon } from './uprtcl-evees';
import { Evees } from './services/evees';

/**
 * Configure a _Prtcl Evees module with the given service providers
 *
 * Example usage:
 *
 *
 * @param eveesProviders array of remote services that implement Evees behaviour
 * @param defaultRemote default remote service to which to create Perspective and Commits
 */
export class EveesModule extends MicroModule {
  static id = 'evees-module';

  dependencies = [];

  static bindings = EveesBindings;

  constructor(protected remotes: Array<EveesRemote>, protected config?: EveesConfig) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    /** set first remote as default remote, the second as official remote, and only the
     * first remote ad editable by default */

    this.config = this.config || {};
    this.config.defaultRemote = this.config.defaultRemote
      ? this.config.defaultRemote
      : this.remotes[0];

    this.config.officialRemote = this.config.officialRemote
      ? this.config.officialRemote
      : this.remotes.length > 1
      ? this.remotes[1]
      : this.remotes[0];

    this.config.editableRemotesIds = this.config.editableRemotesIds
      ? this.config.editableRemotesIds
      : [this.remotes[0].id];

    const router = new ClientRemoteRouter(remotes);
    const cached = new ClientCached();
    const merge = new RecursiveContextMergeStrategy(recognizer);
    const evees = new Evees(cached, recognizer, remotes, merge, this.config);

    for (const remote of this.eveesProviders) {
      container.bind(EveesModule.bindings.Remote).toConstantValue(remote);
    }

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
  }

  get submodules() {
    return [new i18nextModule('evees', { en: en }), new CommonUIModule()];
  }
}
