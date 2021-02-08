import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { PatternRecognizer } from '../patterns/recognizer/pattern-recognizer';

import { EveesConfig } from '../evees/interfaces/types';
import { Evees } from '../evees/evees.service';
import { ClientOnMemory } from '../evees/clients/client.memory';
import { RemoteRouter } from '../evees/clients/client.router';
import { CASStore } from '../cas/interfaces/cas-store';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { Pattern } from '../patterns/interfaces/pattern';

export const buildEvees = (
  remotes: Array<RemoteEvees>,
  store: CASStore,
  recognizer: PatternRecognizer,
  modules: Map<string, EveesContentModule>,
  config?: EveesConfig
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
  // const cached = new ClientLocal(router, store);
  const onMemory = new ClientOnMemory(router, store);

  return new Evees(onMemory, recognizer, remotes, config, modules);
};
