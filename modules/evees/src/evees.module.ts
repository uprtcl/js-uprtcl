import { interfaces } from 'inversify';

import { MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { CASModule } from '@uprtcl/multiplatform';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { CommonUIModule } from '@uprtcl/common-ui';

import { PerspectiveLinks, PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern, CommitLinked } from './patterns/commit.pattern';
import { CommitHistory } from './elements/evees-commit-history';
import { EveesBindings } from './bindings';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { eveesTypeDefs } from './graphql/schema';
import { eveesResolvers } from './graphql/resolvers';
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
import { EveesProposalRow } from './elements/evees-proposal-row';
import { EveesInfoUserBased } from './elements/evees-info-user-based';
import { EveesPerspectiveIcon } from './uprtcl-evees';

/**
 * Configure a _Prtcl Evees module with the given service providers
 *
 * Example usage:
 *
 * ```ts
 * import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
 * import { IpfsStore } from '@uprtcl/ipfs-provider';
 * import { HttpConnection } from '@uprtcl/http-provider';
 * import { EthereumConnection } from '@uprtcl/ethereum-provider';
 * import { EveesModule, EveesEthereum, EveesHttp } from '@uprtcl/evees';
 *
 * const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };
 *
 * const cidConfig = { version: 1, type: 'sha2-256', codec: 'raw', base: 'base58btc' };
 *
 * // Don't put anything on host to get from Metamask's ethereum provider
 * const ethConnection = new EthereumConnection({});
 *
 * const eveesEth = new EveesEthereum(ethConnection, ipfsConfig, cidConfig);
 *
 * const httpConnection = new HttpConnection();
 *
 * const httpEvees = new EveesHttp('http://localhost:3100/uprtcl/1', httpConnection, ethConnection, cidConfig);
 *
 * const evees = new EveesModule([httpEvees, eveesEth], httpEvees);
 *
 * const orchestrator = new MicroOrchestrator();
 *
 * await orchestrator.loadModule(evees);
 * ```
 *
 *
 * @param eveesProviders array of remote services that implement Evees behaviour
 * @param defaultRemote default remote service to which to create Perspective and Commits
 */
export class EveesModule extends MicroModule {
  static id = 'evees-module';

  dependencies = [];

  static bindings = EveesBindings;

  constructor(protected eveesProviders: Array<EveesRemote>, protected config?: EveesConfig) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container.bind(EveesModule.bindings.Evees).to(Evees);
    container.bind(EveesModule.bindings.MergeStrategy).to(RecursiveContextMergeStrategy);

    /** set first remote as default remote, the second as official remote, and only the
     * first remote ad editable by default */

    this.config = this.config || {};

    this.config.defaultRemote = this.config.defaultRemote
      ? this.config.defaultRemote[0]
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
    customElements.define('evees-proposal-row', EveesProposalRow);
    customElements.define('evees-perspective-icon', EveesPerspectiveIcon);
  }

  get submodules() {
    return [
      new GraphQlSchemaModule(eveesTypeDefs, eveesResolvers),
      new i18nextModule('evees', { en: en }),
      new PatternsModule([
        new CommitPattern([CommitLinked]),
        new PerspectivePattern([PerspectiveLinks])
      ]),
      new CASModule(this.eveesProviders.map(p => p.store)),
      new CommonUIModule()
    ];
  }
}
