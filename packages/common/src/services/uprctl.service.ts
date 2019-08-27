import { Observable } from 'rxjs';
import {
  CacheService,
  MultiProviderService,
  Secured,
  CachedMultiProviderService,
  UprtclMultiProvider,
  Signed
} from '@uprtcl/cortex';

import { UprtclProvider } from './uprtcl.provider';
import { Context, Perspective, Commit } from '../types';

export class UprtclService implements UprtclMultiProvider {
  cachedMultiProvider: CachedMultiProviderService<UprtclProvider & CacheService, UprtclProvider>;

  constructor(
    cache: UprtclProvider & CacheService,
    multiProvider: MultiProviderService<UprtclProvider>
  ) {
    this.cachedMultiProvider = new CachedMultiProviderService<
      UprtclProvider & CacheService,
      UprtclProvider
    >(cache, multiProvider);
  }

  /**
   * @override
   */
  createContextIn(source: string, context: Context): Promise<Secured<Context>> {
    return this.cachedMultiProvider.optimisticCreateIn(
      source,
      context,
      service => service.createContext(context),
      (service, securedContext) => service.cloneContext(securedContext)
    );
  }

  /**
   * @override
   */
  createPerspectiveIn(source: string, perspective: Perspective): Promise<Secured<Perspective>> {
    return this.cachedMultiProvider.optimisticCreateIn(
      source,
      perspective,
      service => service.createPerspective(perspective),
      (service, securedPerspective) => service.clonePerspective(securedPerspective)
    );
  }

  /**
   * @override
   */
  createCommitIn(source: string, commit: Commit): Promise<Secured<Commit>> {
    return this.cachedMultiProvider.optimisticCreateIn(
      source,
      commit,
      service => service.createCommit(commit),
      (service, securedCommit) => service.cloneCommit(securedCommit)
    );
  }

  /**
   * @override
   */
  cloneContextIn(source: string, context: Secured<Context>): Promise<string> {
    return this.cachedMultiProvider.remote.createIn(
      source,
      service => service.cloneContext(context),
      context
    );
  }

  /**
   * @override
   */
  clonePerspectiveIn(source: string, perspective: Secured<Perspective>): Promise<string> {
    return this.cachedMultiProvider.remote.createIn(
      source,
      service => service.clonePerspective(perspective),
      perspective
    );
  }

  /**
   * @override
   */
  cloneCommitIn(source: string, commit: Secured<Commit>): Promise<string> {
    return this.cachedMultiProvider.remote.createIn(
      source,
      service => service.cloneCommit(commit),
      commit
    );
  }

  /**
   * @override
   */
  async updateHead(perspectiveId: string, headId: string): Promise<void> {
    const perspective = await this.get<Signed<Perspective>>(perspectiveId);

    if (!perspective) {
      throw new Error(`Perspective with id ${perspectiveId} not found`);
    }

    const origin = perspective.payload.origin;
    this.cachedMultiProvider.optimisticUpdateIn(
      origin,
      perspective,
      service => service.updateHead(perspectiveId, headId),
      service => service.updateHead(perspectiveId, headId),
      `update-head-of-${perspectiveId}`,
      perspectiveId
    );
  }

  /**
   * @override
   */
  getHead(perspectiveId: string): Observable<string | undefined> {
    this.get<Signed<Perspective>>(perspectiveId).then(perspective => {
      if (!perspective) {
        throw new Error(`Perspective with id ${perspectiveId} not found`);
      }

      const origin = perspective.payload.origin;
      const originSource = this.cachedMultiProvider.remote.getSource(origin);

      originSource.getHead(perspectiveId).subscribe(headId => {
        if (headId) this.cachedMultiProvider.cache.updateHead(perspectiveId, headId);
      });
    });

    return this.cachedMultiProvider.cache.getHead(perspectiveId);
  }

  /**
   * @override
   */
  get<T extends object>(hash: string): Promise<T | undefined> {
    return this.cachedMultiProvider.get<T>(hash);
  }

  /**
   * @override
   */
  async getContextPerspectives(contextId: string): Promise<Secured<Perspective>[]> {
    let allPerspectives: Secured<Perspective>[] = [];
    const promises = this.cachedMultiProvider.remote.getAllSources().map(async source => {
      const perspectives = await source.getContextPerspectives(contextId);
      allPerspectives = allPerspectives.concat(perspectives);
    });

    await Promise.all(promises);

    return allPerspectives;
  }
}
