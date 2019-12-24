import { multiInject, injectable, inject } from 'inversify';

import {
  KnownSourcesService,
  DiscoveryTypes,
  CortexTypes,
  PatternRecognizer,
  Creatable,
  CachedMultiSourceService,
  Hashed,
  IsSecure,
  MultiSourceService
} from '@uprtcl/cortex';
import { Logger } from '@uprtcl/micro-orchestrator';

import { WikisLocal, WikisTypes, Wiki } from '../types';
import { WikisRemote } from './wikis.remote';
import { WikisProvider } from './wikis.provider';

@injectable()
export class Wikis {
  logger = new Logger('wikis');

  service: CachedMultiSourceService<WikisLocal, WikisRemote>;

  constructor(
    @inject(CortexTypes.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(DiscoveryTypes.LocalKnownSources)
    protected knownSources: KnownSourcesService,
    @inject(WikisTypes.WikisLocal)
    protected wikisLocal: WikisLocal,
    @multiInject(WikisTypes.WikisRemote)
    protected wikisRemotes: WikisRemote[]
  ) {
    this.service = new CachedMultiSourceService<WikisLocal, WikisRemote>(
      wikisLocal,
      new MultiSourceService<WikisRemote>(patternRecognizer, knownSources, wikisRemotes)
    );
  }

  /**
   * @override
   */
  public ready(): Promise<void> {
    return this.service.ready();
  }

  /** Getters */

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.service.get(hash);
  }

  /**
   * Clones the given textnode in the given provider
   *
   * @param node the text node to clone
   * @param providerName the provider to which to clone the text node to, needed if there is more than one provider
   */
  public async createWiki(node: Wiki, upl?: string): Promise<Hashed<Wiki>> {
    const creator = async (wikis: WikisProvider) => {
      const hash = await wikis.createWiki(node);
      return {
        id: hash,
        object: node
      };
    };

    const cloner = async (wikis: WikisProvider, hashedNode: Hashed<Wiki>) => {
      await wikis.createWiki(hashedNode.object, hashedNode.id);
      return hashedNode;
    };

    const hashedNode = await this.service.optimisticCreateIn(upl, creator, cloner);

    this.logger.info('Cloned wikinode: ', hashedNode);
    return hashedNode;
  }
}
