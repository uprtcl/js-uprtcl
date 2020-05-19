import { interfaces } from 'inversify';

import { MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { CASModule } from '@uprtcl/multiplatform';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { AccessControlModule } from '@uprtcl/access-control';

import {
  PerspectiveLinks,
  PerspectiveAccessControl,
  PerspectivePattern,
} from './patterns/perspective.pattern';
import { CommitPattern, CommitLinked } from './patterns/commit.pattern';
import { CommitHistory } from './elements/evees-commit-history';
import { EveesBindings } from './bindings';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { eveesTypeDefs } from './graphql/schema';
import { eveesResolvers } from './graphql/resolvers';
import { PerspectivesList } from './elements/evees-perspectives-list';
import { EveesInfoPopper } from './elements/evees-info-popper';

import en from './i18n/en.json';
import { RemoteMap, defaultRemoteMap } from './types';
import { EveesInfoPage } from './elements/evees-info-page';
import { ItemWithMenu } from './elements/common-ui/evees-list-item';
import { EveesOptionsMenu } from './elements/common-ui/evees-options-menu';
import { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
import { EveesDiff } from './elements/evees-diff';
import { EveesDialog } from './elements/common-ui/evees-dialog';
import { EveesPopper } from './elements/common-ui/evees-popper';
import { EveesHelp } from './elements/common-ui/evees-help';
import { EveesLoadingButton } from './elements/common-ui/evees-loading-button';

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
 * @param remoteMap optional map between the given evees remotes and the CASSources to create the data to by default
 */
export class EveesModule extends MicroModule {
  static id = 'evees-module';

  dependencies = [AccessControlModule.id];

  static bindings = EveesBindings;

  constructor(
    protected eveesProviders: Array<EveesRemote>,
    protected defaultRemote: EveesRemote,
    protected remoteMap: RemoteMap = defaultRemoteMap
  ) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container.bind(EveesModule.bindings.Evees).to(Evees);
    container.bind(EveesModule.bindings.MergeStrategy).to(RecursiveContextMergeStrategy);
    container.bind(EveesModule.bindings.DefaultRemote).toConstantValue(this.defaultRemote);
    container.bind(EveesModule.bindings.RemoteMap).toConstantValue(this.remoteMap);

    for (const remote of this.eveesProviders) {
      container.bind(EveesModule.bindings.EveesRemote).toConstantValue(remote);
      container.bind(AccessControlModule.bindings.Authority).toConstantValue(remote);
    }

    customElements.define('evees-commit-history', CommitHistory);
    customElements.define('evees-perspectives-list', PerspectivesList);
    customElements.define('evees-info-popper', EveesInfoPopper);
    customElements.define('evees-info-page', EveesInfoPage);
    customElements.define('evees-list-item', ItemWithMenu);
    customElements.define('evees-popper', EveesPopper);
    customElements.define('evees-options-menu', EveesOptionsMenu);
    customElements.define('evees-update-diff', EveesDiff);
    customElements.define('evees-dialog', EveesDialog);
    customElements.define('evees-help', EveesHelp);
    customElements.define('evees-loading-button', EveesLoadingButton);
  }

  get submodules() {
    return [
      new GraphQlSchemaModule(eveesTypeDefs, eveesResolvers),
      new i18nextModule('evees', { en: en }),
      new PatternsModule([
        new CommitPattern([CommitLinked]),
        new PerspectivePattern([PerspectiveLinks, PerspectiveAccessControl]),
      ]),
      new CASModule(this.eveesProviders),
    ];
  }
}
