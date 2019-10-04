import { Store, AnyAction } from 'redux';
import { LazyStore } from 'pwa-helpers/lazy-reducer-enhancer.js';

import { MicroModule, MicroOrchestratorTypes } from '@uprtcl/micro-orchestrator';
import { CortexPattern } from './base/cortex-pattern';
import { lenses } from './lenses';
import { LensSelector } from './base/lens-selector';
import { interfaces, inject, injectable } from 'inversify';
import { CortexTypes } from '../types';
import { DiscoveryService } from '../services/discovery.service';
import { PatternRecognizer } from '../patterns/recognizer/pattern.recognizer';

@injectable()
export class LensesModule implements MicroModule {
  async onLoad(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    customElements.define('lens-selector', LensSelector);
    customElements.define('cortex-pattern', CortexPattern);

    Object.entries(lenses).forEach(([tag, lens]) => {
      customElements.define(tag, lens);
    });
  }

  async onUnload(): Promise<void> {}
}
