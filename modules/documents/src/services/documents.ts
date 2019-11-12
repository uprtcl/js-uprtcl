import { multiInject, injectable, inject } from 'inversify';

import {
  DiscoverableSource,
  KnownSourcesService,
  DiscoveryTypes,
  PatternTypes,
  PatternRecognizer,
  Creatable,
  CachedMultiSourceService,
  Hashed,
  IsSecure,
  MultiSourceService
} from '@uprtcl/cortex';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Secured } from '@uprtcl/common';

import { DocumentsLocal, DocumentsTypes, TextNode } from '../types';
import { DocumentsRemote } from './documents.remote';
import { DocumentsProvider } from './documents.provider';

@injectable()
export class Documents {
  logger = new Logger('documents');

  service: CachedMultiSourceService<DocumentsLocal, DocumentsRemote>;

  constructor(
    @inject(PatternTypes.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(DiscoveryTypes.LocalKnownSources)
    protected knownSources: KnownSourcesService,
    @inject(DocumentsTypes.DocumentsLocal)
    protected documentsLocal: DocumentsLocal,
    @multiInject(DocumentsTypes.DocumentsRemote)
    protected documentsRemotes: DiscoverableSource<DocumentsRemote>[]
  ) {
    this.service = new CachedMultiSourceService<DocumentsLocal, DocumentsRemote>(
      documentsLocal,
      new MultiSourceService<DocumentsRemote>(patternRecognizer, knownSources, documentsRemotes)
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
  public async createTextNode(node: TextNode, upl?: string): Promise<Hashed<TextNode>> {
    const creator = async (docs: DocumentsProvider) => {
      const hash = await docs.createTextNode(node);
      return {
        id: hash,
        object: node
      };
    };

    const cloner = async (docs: DocumentsProvider, hashedNode: Hashed<TextNode>) => {
      const hash = await docs.createTextNode(hashedNode.object, hashedNode.id);
      return {
        id: hash,
        object: node
      };
    };

    const hashedNode = await this.service.optimisticCreateIn(upl, creator, cloner);

    this.logger.info('Cloned textnode: ', hashedNode);
    return hashedNode;
  }
}
