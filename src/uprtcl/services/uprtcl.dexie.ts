import { CacheService } from '../../discovery/cache/cache.service';
import { UprtclService } from './uprtcl.service';
import Dexie from 'dexie';
import { CacheDexie } from '../../discovery/cache/cache.dexie';
import { Perspective, Context, Commit } from '../types';
import EntityRegistry from '../../entity/registry/entity-registry';
import { ContextEntity } from '../entities/context.entity';
import { PerspectiveEntity } from '../entities/perspective.entity';
import { CommitEntity } from '../entities/commit.entity';
import { Secured } from '../../entity/types';

export class UprtclDexie extends Dexie implements CacheService, UprtclService {
  heads: Dexie.Table<string, string>;

  constructor(
    protected entityRegistry: EntityRegistry,
    protected objectsCache: CacheService = new CacheDexie()
  ) {
    super('uprtcl');
    this.version(0.1).stores({
      heads: ''
    });
    this.heads = this.table('heads');
  }

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<T | undefined> {
    return this.objectsCache.get(hash);
  }

  /**
   * @override
   */
  public cache<T extends object>(hash: string, object: T): Promise<void> {
    return this.objectsCache.cache(hash, object);
  }

  /**
   * @override
   */
  async createContext(context: Context): Promise<string> {
    // TODO: create proof
    const entity: ContextEntity = this.entityRegistry.from(context);
    const hash = entity.getId();

    await this.cache(hash, context);
    return hash;
  }

  /**
   * @override
   */
  async createPerspective(perspective: Perspective): Promise<string> {
    // TODO: create proof
    const entity: PerspectiveEntity = this.entityRegistry.from(perspective);
    const hash = entity.getId();

    await this.cache(hash, perspective);
    return hash;
  }

  /**
   * @override
   */
  async createCommit(commit: Commit): Promise<string> {
    // TODO: create proof
    const entity: CommitEntity = this.entityRegistry.from(commit);
    const hash = entity.getId();

    await this.cache(hash, commit);
    return hash;
  }

  /**
   * @override
   */
  async cloneContext(context: Secured<Context>): Promise<string> {
    const entity: ContextEntity = this.entityRegistry.from(context);

    entity.validate();

    await this.cache(context.id, context.object);
    return context.id;
  }

  /**
   * @override
   */
  async clonePerspective(perspective: Secured<Perspective>): Promise<string> {
    // TODO: create proof
    const entity: PerspectiveEntity = this.entityRegistry.from(perspective);
    entity.validate();

    await this.cache(perspective.id, perspective.object);
    return perspective.id;
  }

  /**
   * @override
   */
  async cloneCommit(commit: Secured<Commit>): Promise<string> {
    // TODO: check proof
    const entity: CommitEntity = this.entityRegistry.from(commit);
    entity.validate();

    await this.cache(commit.id, commit.object);
    return commit.id;
  }

  /**
   * @override
   */
  async updateHead(perspectiveId: string, headId: string): Promise<void> {
    await this.heads.put(headId, perspectiveId);
  }

  /**
   * @override
   */
  getHead(perspectiveId: string): Promise<string | undefined> {
    return this.heads.get(perspectiveId);
  }
}
