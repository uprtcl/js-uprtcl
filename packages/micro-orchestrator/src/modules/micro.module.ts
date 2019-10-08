import { interfaces } from 'inversify';

export interface MicroModule {
  onLoad(): Promise<void>;

  onInit(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): void;

  onUnload(): Promise<void>;
}
