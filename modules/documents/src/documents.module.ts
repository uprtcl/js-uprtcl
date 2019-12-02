import { injectable } from 'inversify';

import { DiscoverableSource, SourceProvider } from '@uprtcl/cortex';
import { ReduxCortexModule } from '@uprtcl/common';

import { TextNodeLens } from './lenses/text-node.lens';
import { TextNodePattern } from './patterns/text-node.pattern';
import { DocumentsTypes } from './types';
import { DocumentsProvider } from './services/documents.provider';
import { DocumentsLocal } from './services/documents.local';
import { Documents } from './services/documents';
import { DocumentsRemote } from './services/documents.remote';
import { TextNodeEntity } from './patterns/text-node.entity';

/**
 * Configure a documents module with the given providers
 *
 * Depends on: lensesModule, PatternsModule, discoveryModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsConnection } from '@uprtcl/connections';
 * import { documentsModule, DocumentsTypes, DocumentsIpfs } from '@uprtcl/documents';
 *
 * const ipfsConnection = new IpfsConnection({
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 *  const documentsProvider = new DocumentsIpfs(ipfsConnection);
 *
 * const docs = documentsModule([{ service: documentsProvider }]);
 * await orchestrator.loadModules({
 *   id: DocumentsTypes.Module,
 *   module: docs
 * });
 * ```
 *
 * @category CortexModule
 *
 * @param documentsRemote an array of remotes of documents
 * @param documentsLocal the local cache service to
 * @returns a configured documents module ready to be loaded
 */
export function documentsModule(
  documentsRemotes: DiscoverableSource<DocumentsRemote>[],
  documentsLocal: new (...args: any[]) => DocumentsProvider = DocumentsLocal
): new (...args: any[]) => ReduxCortexModule {
  @injectable()
  class DocumentsModule extends ReduxCortexModule {
    get sources() {
      return documentsRemotes.map(remote => ({
        symbol: DocumentsTypes.DocumentsRemote,
        source: remote
      }));
    }

    get services() {
      return [
        { symbol: DocumentsTypes.DocumentsLocal, service: documentsLocal },
        { symbol: DocumentsTypes.Documents, service: Documents }
      ];
    }

    get elements() {
      return [{ name: 'text-node', element: TextNodeLens }];
    }

    get patterns() {
      return [
        { symbol: DocumentsTypes.TextNodeEntity, pattern: TextNodeEntity },
        { symbol: DocumentsTypes.TextNodePattern, pattern: TextNodePattern }
      ];
    }
  }

  return DocumentsModule;
}
