import { CustomStore } from '@uprtcl/orbitdb-provider';

import { type as contextType } from './context-access-controller';

export enum PolkadotEveesOrbitDBEntities {
  Context = 'CONTEXT_POLKADOT'
}

export const context: CustomStore = {
  customType: PolkadotEveesOrbitDBEntities.Context,
  type: 'set',
  name: entity => `polkadot-context-store/${entity.context}`,
  options: entity => {
    return {
      accessController: { type: contextType, write: ['*'] }
    };
  }
};
