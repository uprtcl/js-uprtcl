import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { buildStore } from './build.store';
import { buildRecognizer } from './build.recognizer';
import { Pattern } from '../patterns/interfaces/pattern';
import { buildEvees } from './build.evees';
import { CASRemote } from '../cas/interfaces/cas-remote';
import { Evees } from '../evees/evees.service';

import { registerComponents } from '../../../evees-ui/src/behaviours/register.components';

/** a top level wrapper that registers everything */
export const eveesConstructorHelper = (
  remotes: RemoteEvees[],
  stores: CASRemote[],
  modules: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  /** extract the stores and map remotes to stores */
  const evees = eveesConstructorHelper(remotes, stores, modules, patterns, config);
  registerComponents(evees);
  return evees;
};
