import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CASStore, CASModule } from '@uprtcl/multiplatform';
import { EveesModule } from './evees.module';

export abstract class EveesContentModule extends MicroModule {
  constructor(protected stores: Array<CASStore | interfaces.ServiceIdentifier<CASStore>> = []) {
    super();
  }

  dependencies = [EveesModule.id];

  abstract providerIdentifier: interfaces.ServiceIdentifier<CASStore> | undefined;

  async onLoad(container: interfaces.Container) {
    this.stores.forEach((storeOrId) => {
      const store =
        typeof storeOrId === 'object' && (storeOrId as CASStore).casID
          ? (storeOrId as CASStore)
          : container.get(storeOrId as interfaces.ServiceIdentifier<CASStore>);

      if (this.providerIdentifier) {
        container.bind<CASStore>(this.providerIdentifier).toConstantValue(store);
      }
    });
  }

  get submodules(): MicroModule[] {
    return [new CASModule(this.stores.filter((store) => (store as CASStore).casID) as CASStore[])];
  }
}
