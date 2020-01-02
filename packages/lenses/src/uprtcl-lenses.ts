// Required by inversify
import 'reflect-metadata';

/** Lenses */
export { LensesModule } from './lenses.module';
export { SlotPlugin } from './plugins/slot.plugin';
export { LensSelectorPlugin } from './plugins/base/lens-selector.plugin';
export { ActionsPlugin } from './plugins/base/actions.plugin';
export { CortexEntityBase } from './elements/cortex-entity-base';
export { CortexEntity } from './elements/cortex-entity';
export { Lens, LensesPlugin } from './types';
export { HasLenses } from './properties/has-lenses';

export { sharedStyles } from './shared-styles';
