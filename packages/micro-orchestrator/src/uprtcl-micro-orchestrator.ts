// Required by inversify
import 'reflect-metadata';

export { MicroOrchestrator } from './orchestrator/micro-orchestrator';
export { MicroModule } from './orchestrator/micro.module';
export { ModuleProvider } from './orchestrator/module-provider';

export { Constructor, CustomElement, Dictionary } from './types';

/** Elements */
export { ModuleContainer, RequestDependencyEvent } from './elements/module-container';
export { moduleConnect, ConnectedElement } from './elements/module-connect.mixin';
export { request } from './elements/request-decorator';

/** Utils */
export { Logger, LogLevel } from './utils/logger';

/** i18n */
export { i18nextBaseModule } from './modules/i18n/i18next-base.module';
export { i18nextModule } from './modules/i18n/i18next.module';
