import { interfaces, injectable, inject } from 'inversify';
import { i18n } from 'i18next';

import {
  Dictionary,
  MicroModule,
  Constructor,
  MicroOrchestratorTypes,
  ModuleProvider,
  i18nTypes
} from '@uprtcl/micro-orchestrator';

@injectable()
export abstract class i18nextModule implements MicroModule {
  abstract get namespace(): string;
  abstract get resources(): Dictionary<Dictionary<string>>;

  constructor(
    @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
  ) {}

  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    await this.moduleProvider(i18nTypes.Module);

    const i18next: i18n = context.container.get(i18nTypes.Service);

    await i18next.loadNamespaces(this.namespace);

    Object.keys(this.resources).map(lang => {
      i18next.addResources(lang, this.namespace, this.resources[lang]);
    });
  }
}

export function i18nModule(
  namespace: string,
  resources: Dictionary<Dictionary<string>>
): Constructor<MicroModule> {
  @injectable()
  class Concretei18nextModule extends i18nextModule {
    get namespace() {
      return namespace;
    }

    get resources() {
      return resources;
    }
  }

  return Concretei18nextModule;
}
