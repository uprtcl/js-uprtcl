import { interfaces } from 'inversify';
import i18next from 'i18next';

import { MicroModule } from '../../orchestrator/micro.module';

export class i18nextBaseModule extends MicroModule {
  static id = 'i18n-base-module';

  static bindings = {
    Translate: 'i18n-function',
    Service: 'i18n-service',
  };

  async onLoad(container: interfaces.Container): Promise<void> {
    const translateFunction = await i18next.init({
      fallbackLng: 'en',
      ns: ['core'],
      defaultNS: 'core',
    });

    container.bind(i18nextBaseModule.bindings.Service).toConstantValue(i18next);
    container.bind(i18nextBaseModule.bindings.Translate).toConstantValue(translateFunction);
  }
}
