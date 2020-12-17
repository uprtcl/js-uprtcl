import { interfaces } from 'inversify';

import { MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { CASModule } from '@uprtcl/multiplatform';
import { CommonUIModule } from '@uprtcl/common-ui';

import {
  PerspectiveLinks,
  PerspectivePattern,
} from './patterns/perspective.pattern';
import { CommitPattern, CommitLinked } from './patterns/commit.pattern';
import { CommitHistory } from './elements/evees-commit-history';
import { EveesBindings } from './bindings';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
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

  constructor(
    protected eveesProviders: Array<EveesRemote>,
    protected config?: EveesConfig
  ) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    /** set first remote as default remote, the second as official remote, and only the
     * first remote ad editable by default */

    this.config = this.config || {};

    this.config.defaultRemote = this.config.defaultRemote
      ? this.config.defaultRemote
      : this.eveesProviders[0];

    this.config.officialRemote = this.config.officialRemote
      ? this.config.officialRemote
      : this.eveesProviders.length > 1
      ? this.eveesProviders[1]
      : this.eveesProviders[0];

    this.config.editableRemotesIds = this.config.editableRemotesIds
      ? this.config.editableRemotesIds
      : [this.eveesProviders[0].id];

    container.bind(EveesModule.bindings.Config).toConstantValue(this.config);
    container.bind(EveesModule.bindings.Evees).to(Evees);
    container
      .bind(EveesModule.bindings.MergeStrategy)
      .to(RecursiveContextMergeStrategy);

    for (const remote of this.eveesProviders) {
      container.bind(EveesModule.bindings.EveesRemote).toConstantValue(remote);
      container.bind(EveesModule.bindings.Remote).toConstantValue(remote);
    }

    customElements.define('evees-commit-history', CommitHistory);
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
    return [
      new i18nextModule('evees', { en: en }),
      new PatternsModule([
        new CommitPattern([CommitLinked]),
        new PerspectivePattern([PerspectiveLinks]),
      ]),
      new CASModule(this.eveesProviders.map((p) => p.store)),
      new CommonUIModule(),
    ];
  }
}
