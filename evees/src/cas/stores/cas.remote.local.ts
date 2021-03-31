import { CASRemote } from '../interfaces/cas-remote';
import { CidConfig, defaultCidConfig } from '../interfaces/cid-config';
import { Entity, EntityCreate } from '../interfaces/entity';
import { hashObject } from '../utils/cid-hash';
import { CASLocal } from './cas.local';

export class CASRemoteLocal extends CASLocal implements CASRemote {
  casID: string = 'cas-local';
  isLocal: boolean = true;
  cidConfig: CidConfig = defaultCidConfig;

  // Overrides
  hashEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((e) => this.hash(e.object)));
  }

  async hash(object: object): Promise<Entity> {
    /** optimistically hash based on the CidConfig without asking the server */
    const id = await hashObject(object, this.cidConfig);

    return {
      id,
      object,
      casID: this.casID,
    };
  }
}
