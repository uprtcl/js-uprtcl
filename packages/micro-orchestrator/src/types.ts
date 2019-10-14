import { MicroModule } from './modules/micro.module';
import { ModuleProvider } from './orchestrator/module-provider';

export type Constructor<T, A = any[]> = new (args: A) => T;

export const MicroOrchestratorTypes = {
  Logger: Symbol('logger'),
  ModuleProvider: Symbol('module-provider')
};

export const ReduxTypes = {
  Store: Symbol('redux-store'),
  Module: Symbol('redux-module')
};

export interface ModuleToLoad {
  id: symbol;
  module: Constructor<MicroModule, [ModuleProvider]>;
}
