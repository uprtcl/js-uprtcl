import Dexie from 'dexie';
import 'dexie-observable';
import { Observable } from 'rxjs';

import { CacheService } from '../../discovery/cache/cache.service';
import { CacheDexie } from '../../discovery/cache/cache.dexie';

import { UprtclProvider } from './uprtcl.provider';
import { Perspective, Context, Commit } from '../types';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { SecuredPattern, Secured } from '../../patterns/derive/secured.pattern';
import { ValidateProperties } from '../../patterns/validate.pattern';
import { DatabaseChangeType } from 'dexie-observable/api';

export class UprtclDexie extends Dexie implements CacheService, UprtclProvider {
  heads: Dexie.Table<string, string>;

  constructor(
    protected patternRegistry: PatternRegistry,
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

  private secure<T>(object: T): Secured<T> {
    const pattern: SecuredPattern = this.patternRegistry.getPattern('secure') as SecuredPattern;
    return pattern.derive<T>(object);
  }

  /**
   * @override
   */
  async createContext(context: Context): Promise<Secured<Context>> {
    const secured = this.secure(context);

    await this.cache(secured.id, secured);
    return secured;
  }

  /**
   * @override
   */
  async createPerspective(perspective: Perspective): Promise<Secured<Perspective>> {
    const secured = this.secure(perspective);

    await this.cache(secured.id, secured);
    return secured;
  }

  /**
   * @override
   */
  async createCommit(commit: Commit): Promise<Secured<Commit>> {
    const secured = this.secure(commit);

    await this.cache(secured.id, secured);
    return secured;
  }

  /**
   * @override
   */
  async cloneContext(context: Secured<Context>): Promise<string> {
    const properties: ValidateProperties = this.patternRegistry.from(context) as ValidateProperties;

    if (properties.validate()) {
      throw new Error('Context is not valid');
    }

    await this.cache(context.id, context);
    return context.id;
  }

  /**
   * @override
   */
  async clonePerspective(perspective: Secured<Perspective>): Promise<string> {
    const properties: ValidateProperties = this.patternRegistry.from(
      perspective
    ) as ValidateProperties;

    if (properties.validate()) {
      throw new Error('Perspective is not valid');
    }

    await this.cache(perspective.id, perspective);
    return perspective.id;
  }

  /**
   * @override
   */
  async cloneCommit(commit: Secured<Commit>): Promise<string> {
    const properties: ValidateProperties = this.patternRegistry.from(commit) as ValidateProperties;

    if (properties.validate()) {
      throw new Error('Commit is not valid');
    }

    await this.cache(commit.id, commit);
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
  getHead(perspectiveId: string): Observable<string | undefined> {
    return new Observable(subscriber => {
      this.on('changes', changes => {
        changes.forEach(change => {
          switch (change.type) {
            case DatabaseChangeType.Create:
              if (change.key === perspectiveId) subscriber.next(change.obj);
              break;
            case DatabaseChangeType.Update:
              if (change.key === perspectiveId) {
                const headId = change.mods[Object.keys(change.mods)[0]];
                subscriber.next(headId);
              }
              break;
            case DatabaseChangeType.Delete:
              if (change.key === perspectiveId) subscriber.next(undefined);
              break;
          }
        });
      });
    });
  }
}
