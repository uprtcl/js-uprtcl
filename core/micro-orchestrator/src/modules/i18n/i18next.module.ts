import { interfaces } from 'inversify';
import { i18n } from 'i18next';

import { i18nextBaseModule } from './i18next-base.module';
import { Dictionary } from '../../types';
import { MicroModule } from '../../orchestrator/micro.module';

export class i18nextModule extends MicroModule {
  dependencies = [i18nextBaseModule.id];

  constructor(protected namespace: string, protected resources: Dictionary<Dictionary<string>>) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    const i18next: i18n = container.get(i18nextBaseModule.bindings.Service);

    await i18next.loadNamespaces(this.namespace);

    Object.keys(this.resources).map((lang) => {
      i18next.addResources(lang, this.namespace, this.resources[lang]);
    });
  }
}
