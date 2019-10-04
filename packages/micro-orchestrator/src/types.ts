import { MicroModule } from './modules/micro.module';
import { Dictionary } from 'lodash';

export type Constructor<T, A = any[]> = new (args: A) => T;

export type ModuleConstructor<T extends MicroModule = MicroModule> = Constructor<
  T,
  Dictionary<MicroModule>
> & {
  declareDependencies(): Array<ModuleConstructor>;
  getId(): string;
};

export const MicroOrchestratorTypes = {
  ReduxStore: Symbol('redux-store')
};
