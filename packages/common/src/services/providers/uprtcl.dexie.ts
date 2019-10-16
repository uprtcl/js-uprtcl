import Dexie from 'dexie';
import 'dexie-observable';
import { inject, injectable } from 'inversify';

import {
  CacheService,
  Secured,
  Hashed,
  Signed,
  SecuredPattern,
  PatternTypes,
  DiscoveryTypes
} from '@uprtcl/cortex';

import { Perspective, Commit, UprtclLocal } from '../../types';

@injectable()
export class UprtclDexie extends Dexie implements UprtclLocal {
  heads: Dexie.Table<string, string>;
  contexts: Dexie.Table<{ context: string }, string>;

  constructor(
    @inject(PatternTypes.Core.Secured)
    protected securedPattern: SecuredPattern<any>,
    @inject(DiscoveryTypes.Cache)
    protected objectsCache: CacheService
  ) {
    super('uprtcl');
    this.version(0.1).stores({
      heads: '',
      contexts: ',context'
    });
    this.heads = this.table('heads');
    this.contexts = this.table('contexts');
  }

  /**
   * Service is already ready on instantiaton
   */
  public ready() {
    return Promise.resolve();
  }

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
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
  async clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    if (!this.securedPattern.validate(perspective)) {
      throw new Error('Perspective is not valid');
    }

    await this.cache(perspective.id, perspective);
  }

  /**
   * @override
   */
  async cloneCommit(commit: Secured<Commit>): Promise<void> {
    if (!this.securedPattern.validate(commit)) {
      throw new Error('Commit is not valid');
    }

    await this.cache(commit.id, commit);
  }

  /**
   * @override
   */
  async updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void> {
    await this.heads.put(headId, perspectiveId);
  }

  /**
   * @override
   */
  async updatePerspectiveContext(perspectiveId: string, context: string): Promise<void> {
    await this.contexts.put({ context }, perspectiveId);
  }

  /**
   * @override
   */
  getPerspectiveHead(perspectiveId: string): Promise<string | undefined> {
    return this.heads.get(perspectiveId);
  }

  /**
   * @override
   */
  async getPerspectiveContext(perspectiveId: string): Promise<string | undefined> {
    const context = await this.contexts.get(perspectiveId);
    return context ? context.context : undefined;
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    const perspectivesIds = await this.contexts
      .where('context')
      .equals(context)
      .primaryKeys();

    if (!perspectivesIds) return [];

    const promises = perspectivesIds.map(perspective => this.get<Signed<Perspective>>(perspective));
    const perspectives = await Promise.all(promises);
    return perspectives.filter(p => p !== undefined) as Secured<Perspective>[];
  }
}
