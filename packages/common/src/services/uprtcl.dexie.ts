import Dexie from 'dexie';
import 'dexie-observable';
import uniq from 'lodash/uniq';

import {
  CacheService,
  CacheDexie,
  PatternRegistry,
  Secured,
  ValidatePattern,
  SecuredPattern
} from '@uprtcl/cortex';

import { UprtclProvider } from './uprtcl.provider';
import { Perspective, Context, Commit } from '../types';
import { DatabaseChangeType } from 'dexie-observable/api';

const creatorId = 'did:hi:example';
const origin = 'exampleOrigin';

export class UprtclDexie extends Dexie implements CacheService, UprtclProvider {
  heads: Dexie.Table<string, string>;
  perspectivesContexts: Dexie.Table<string, string>;

  constructor(
    protected patternRegistry: PatternRegistry,
    protected objectsCache: CacheService = new CacheDexie()
  ) {
    super('uprtcl');
    this.version(0.1).stores({
      heads: '',
      perspectivesContexts: ''
    });
    this.heads = this.table('heads');
    this.perspectivesContexts = this.table('perspectivesContexts');
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
   * Creates a secured version of the given object
   */
  private secure<T extends object>(object: T): Secured<T> {
    const pattern: SecuredPattern<Secured<T>> = this.patternRegistry.getPattern('secured');
    return pattern.derive(object);
  }

  /**
   * @override
   */
  async createContext(timestamp: number, nonce: number): Promise<Secured<Context>> {
    const secured: Secured<Context> = this.secure({
      creatorId: creatorId,
      timestamp,
      nonce
    });

    await this.cache(secured.id, secured);
    return secured;
  }

  /**
   * @override
   */
  async createPerspective(name: string, timestamp: number): Promise<Secured<Perspective>> {
    const secured: Secured<Perspective> = this.secure({
      name,
      timestamp,
      creatorId,
      origin
    });

    await this.cache(secured.id, secured);

    return secured;
  }

  /**
   * @override
   */
  async createCommit(
    dataId: string,
    parentsIds: Array<string>,
    message: string,
    timestamp: number
  ): Promise<Secured<Commit>> {
    const secured: Secured<Commit> = this.secure({
      dataId,
      parentsIds,
      message,
      timestamp,
      creatorId
    });

    await this.cache(secured.id, secured);
    return secured;
  }

  /**
   * @override
   */
  async cloneContext(context: Secured<Context>): Promise<string> {
    const pattern: ValidatePattern<Secured<Context>> = this.patternRegistry.recognizeMerge(context);

    if (pattern.validate(context)) {
      throw new Error('Context is not valid');
    }

    await this.cache(context.id, context);
    return context.id;
  }

  /**
   * @override
   */
  async clonePerspective(perspective: Secured<Perspective>): Promise<string> {
    const pattern: ValidatePattern<Secured<Perspective>> = this.patternRegistry.recognizeMerge(
      perspective
    );

    if (pattern.validate(perspective)) {
      throw new Error('Perspective is not valid');
    }

    await this.cache(perspective.id, perspective);
    await this.addContextPerspective(perspective.object.payload.contextId, perspective.id);

    return perspective.id;
  }

  /**
   * @override
   */
  async cloneCommit(commit: Secured<Commit>): Promise<string> {
    const pattern: ValidatePattern<Secured<Commit>> = this.patternRegistry.recognizeMerge(commit);

    if (pattern.validate(commit)) {
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

  /**
   * @override
   */
  async getContextPerspectives(contextId: string): Promise<Secured<Perspective>[]> {
    const perspectivesIds = await this.contextPerspectives.get(contextId);

    if (!perspectivesIds) return [];

    const promises = perspectivesIds.map(perspective =>
      this.get<Secured<Perspective>>(perspective)
    );
    const perspectives = await Promise.all(promises);
    return perspectives.filter(p => p !== undefined) as Secured<Perspective>[];
  }
}
