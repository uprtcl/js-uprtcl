import { CustomStore } from './types';

export enum EveesOrbitDBRootEntities {
  AddressMapping = 'ADDRESS_MAPPING'
}

export const addressMapping: CustomStore = {
  customType: EveesOrbitDBRootEntities.AddressMapping,
  type: 'eventlog',
  name: source => `address-mapping/${source.sourceId}`,
  options: source => {
    return {
      accessController: { type: 'ipfs', write: [source.key] }
    };
  }
};
