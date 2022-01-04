import { CidConfig, defaultCidConfig, Entity, EntityCreate, EntityRemote } from '../../interfaces';
import { hashObject } from '../../utils';
import { Logger } from '../../../utils';
import { EntityStoreDB } from './entity.store.local.db';

const LOGINFO = false;
export class EntityRemoteLocal implements EntityRemote {
  logger = new Logger('EntityRemoteLocal');
  
  public id: string = 'local';
  readonly db: EntityStoreDB;
  protected cidConfig: CidConfig;

  constructor(db?: EntityStoreDB, cidConfig?: CidConfig, id: string = 'local') {
    this.db = db || new EntityStoreDB();
    this.id = id;
    this.cidConfig = cidConfig || defaultCidConfig;
  }

  async persistEntities(entities: Entity<any>[]): Promise<void> {
    await Promise.all(entities.map((entity) => this.persistEntity(entity)));
  }

  async persistEntity(entity: Entity<any>): Promise<void> {
    await this.db.entities.put(entity);
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entity = await this.db.entities.get(hash);
    if (!entity) throw new Error(`Entity ${hash} not found`);
    return entity;
  }

  async hash(object: object): Promise<Entity> {
    /** optimistically hash based on the CidConfig without asking the server */
    const hash = await hashObject(object, this.cidConfig);

    const entity = {
      hash,
      object,
      remote: this.id,
    };

    if (LOGINFO) this.logger.log('hash', { entity, cidConfig: this.cidConfig });

    return entity;
  }

  hashObjects(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    return Promise.all(entities.map((e) => this.hash(e.object)));
  }

  async hashObject<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    const entities = await this.hashObjects([entity]);
    return entities[0];
  }

  removeEntities(hashes: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getEntities(hashes: string[]): Promise<Entity<any>[]> {
    return Promise.all(hashes.map((hash) => this.getEntity(hash)));
  }
}
