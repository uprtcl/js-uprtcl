import { interfaces } from 'inversify';

export interface MicroModule {
  onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void>;

  onUnload(): Promise<void>;
}
