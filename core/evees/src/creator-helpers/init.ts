import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { initRecognizer } from './init.recognizer';
import { Pattern } from '../patterns/interfaces/pattern';
import { Evees } from '../evees/evees.service';
import { RemoteRouter } from '../evees/clients/client.router';
import { ClientCachedLocal } from '../evees/clients/local/client.cached.local';
import { ClientOnMemory } from '../evees/clients/memory/client.memory';

/** a top level wrapper that registers everything */
export const init = (
  remotes: RemoteEvees[],
  modules: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  const recognizer = initRecognizer(modules, patterns);

  const clientRouter = new RemoteRouter(remotes);
  const cached = new ClientCachedLocal(clientRouter);
  const onMemory = new ClientOnMemory(cached);

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

  const evees = new Evees(onMemory, recognizer, remotes, config, modules);

  return evees;
};
