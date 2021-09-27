import {
  ClientRemote,
  EveesConfig,
  EveesContentModule,
  Pattern,
  Evees,
  initDefaultClientStack,
  EntityResolver,
} from '@uprtcl/evees';
import { registerComponents } from './register.components';

/** a top level wrapper that registers everything */
export const initDefault = (
  clientRemotes: ClientRemote[],
  entityResolver?: EntityResolver,
  modules?: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  /** extract the stores and map remotes to stores */
  const evees = initDefaultClientStack(clientRemotes, entityResolver, modules, patterns, config);
  registerComponents(evees);
  return evees;
};
