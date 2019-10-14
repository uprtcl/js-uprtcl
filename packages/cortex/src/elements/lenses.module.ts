import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexEntity } from './base/cortex-entity';
import { lenses } from './lenses';
import { LensSelector } from './base/lens-selector';
import { interfaces, inject, injectable } from 'inversify';

@injectable()
export class LensesModule implements MicroModule {
  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    customElements.define('lens-selector', LensSelector);
    customElements.define('cortex-entity', CortexEntity);

    Object.entries(lenses).forEach(([tag, lens]) => {
      customElements.define(tag, lens);
    });
  }

  async onUnload(): Promise<void> {}
}
