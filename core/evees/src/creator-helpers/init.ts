import { ClientRemote } from '../evees/interfaces/client.remote';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { initRecognizer } from './init.recognizer';
import { Pattern } from '../patterns/interfaces/pattern';
import { Evees } from '../evees/evees.service';
import { RemoteRouter } from '../evees/clients/client.router';
import { ClientMutationLocal } from '../evees/clients/local/client.mutation.local';
import { ClientMutationMemory } from '../evees/clients/memory/mutation.memory';

/** a top level wrapper that registers everything */
export const init = (
  remotes: ClientRemote[],
  modules: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  const recognizer = initRecognizer(modules, patterns);

  const clientRouter = new RemoteRouter(remotes);
  const cached = new ClientMutationLocal(clientRouter);
  const onMemory = new ClientMutationMemory(cached);

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
