// Required by inversify
import 'reflect-metadata';

export { MicroOrchestrator } from './orchestrator/micro-orchestrator';
export { MicroModule } from './orchestrator/micro.module';
export { ModuleProvider } from './orchestrator/module-provider';

export { Constructor, CustomElement, Dictionary, ReduxTypes } from './types';

/** Redux */
export { ReduxStoreModule } from './modules/redux/redux-store.module';
export { ReduxModule } from './modules/redux/redux.module';

/** Elements */
export { ElementsModule } from './modules/elements.module';
export { ModuleContainer, RequestDependencyEvent } from './elements/module-container';
export { moduleConnect, ConnectedElement } from './elements/mixins/module-connect.mixin';
export { reduxConnect, ReduxConnectedElement } from './elements/mixins/redux-connect.mixin';

/** Utils */
export { Logger, LogLevel } from './utils/logger';

/** i18n */
export { i18nextBaseModule } from './modules/i18n/i18next-base.module';
export { i18nextModule } from './modules/i18n/i18next.module';
