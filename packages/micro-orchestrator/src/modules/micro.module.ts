import { interfaces } from 'inversify';

export interface MicroModule {
  onLoad(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void>;

  onUnload(): Promise<void>;
}
