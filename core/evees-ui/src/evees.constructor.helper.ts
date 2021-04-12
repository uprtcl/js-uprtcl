import { RemoteEvees, EveesConfig, EveesContentModule, Pattern, CASRemote, Evees } from '@uprtcl/evees';
import { registerComponents } from './register.components';

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
