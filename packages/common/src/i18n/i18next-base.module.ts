import { interfaces, injectable } from 'inversify';
import i18next from 'i18next';

import { i18nTypes, MicroModule } from '@uprtcl/micro-orchestrator';

@injectable()
export class i18nextBaseModule implements MicroModule {
  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    const translateFunction = await i18next.init({
      fallbackLng: 'en',
      ns: ['core'],
      defaultNS: 'core'
    });

    bind(i18nTypes.Service).toConstantValue(i18next);
    bind(i18nTypes.Translate).toConstantValue(translateFunction);
  }
}
