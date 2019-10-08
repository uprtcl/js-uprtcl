import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexPattern } from './base/cortex-pattern';
import { lenses } from './lenses';
import { LensSelector } from './base/lens-selector';
import { interfaces, inject, injectable } from 'inversify';

@injectable()
export class LensesModule implements MicroModule {
  onInit(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): void {
    customElements.define('lens-selector', LensSelector);
    customElements.define('cortex-pattern', CortexPattern);

    Object.entries(lenses).forEach(([tag, lens]) => {
      customElements.define(tag, lens);
    });
  }

  async onLoad(): Promise<void> {}
  async onUnload(): Promise<void> {}
}
