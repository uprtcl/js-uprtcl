import {
  ClientRemote,
  EntityRemote,
  EveesConfig,
  EveesContentModule,
  Pattern,
  Evees,
  init as baseInit,
} from '@uprtcl/evees';
import { registerComponents } from './register.components';

/** a top level wrapper that registers everything */
export const init = (
  clientRemotes: ClientRemote[],
  entityRemotes: EntityRemote[],
  modules: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  /** extract the stores and map remotes to stores */
  const evees = baseInit(clientRemotes, entityRemotes, modules, patterns, config);
  registerComponents(evees);
  return evees;
};
