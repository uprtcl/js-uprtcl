import { PatternRecognizer } from 'src/evees/elements/node_modules/src/evees/patterns/node_modules/src/evees/merge/node_modules/src/evees/behaviours/node_modules/@uprtcl/cortex';

import { RemoteEvees } from '../services/remote.evees';
import { EveesConfig } from '../evees/interfaces/types';
import { RecursiveContextMergeStrategy } from '../evees/merge/recursive-context.merge-strategy';
import { Evees } from '../evees/evees.service';
import { ClientLocal } from '../evees/clients/client.local';
import { ClientOnMemory } from '../evees/clients/client.memory';
import { RemoteRouter } from '../evees/clients/client.router';
import { CASStore } from '../cas/interfaces/cas-store';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';

export const buildEvees = (
  remotes: Array<RemoteEvees>,
  store: CASStore,
  recognizer: PatternRecognizer,
  config?: EveesConfig,
  modules?: EveesContentModule[]
): Evees => {
  config = config || {};
  config.defaultRemote = config.defaultRemote ? config.defaultRemote : remotes[0];

  config.officialRemote = config.officialRemote
    ? config.officialRemote
    : remotes.length > 1
    ? remotes[1]
    : remotes[0];

  config.editableRemotesIds = config.editableRemotesIds
    ? config.editableRemotesIds
    : [remotes[0].id];

  const router = new RemoteRouter(remotes, store);
  const cached = new ClientLocal(router, store);
  const onMemory = new ClientOnMemory(cached, store);
  const merge = new RecursiveContextMergeStrategy();

  return new Evees(onMemory, recognizer, remotes, merge, config, modules);
};
