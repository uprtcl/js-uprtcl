import { injectable, interfaces } from 'inversify';

import { patternsModule, sourcesModule } from '@uprtcl/cortex';
import { graphQlSchemaModule, i18nModule } from '@uprtcl/common';
import { elementsModule, MicroModule, Constructor } from '@uprtcl/micro-orchestrator';

import { TextNodeLens } from './lenses/text-node.lens';
import { TextNodeActions, TextNodeCreate, TextNodePatterns } from './patterns/text-node.entity';
import { DocumentsTypes } from './types';
import { DocumentsLocal } from './services/documents.local';
import { Documents } from './services/documents';
import { DocumentsRemote } from './services/documents.remote';
import { documentsTypeDefs, documentsSchema } from './graphql';

import en from '../i18n/en.json';

/**
 * Configure a documents module with the given service providers
 *
 * Depends on these modules being present: lensesModule, CortexModule, discoveryModule, i18nBaseModule
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
 * const docs = documentsModule([ documentsProvider ]);
 * await orchestrator.loadModules({
 *   [DocumentsTypes.Module]: docs
 * });
 * ```
 *
 * @category CortexModule
 *
 * @param documentsRemote an array of remotes of documents
 * @returns a configured documents module ready to be loaded
 */
export function documentsModule(documentsRemotes: DocumentsRemote[]): Constructor<MicroModule> {
  @injectable()
  class DocumentsModule implements MicroModule {
    async onLoad(context: interfaces.Context, bind: interfaces.Bind) {
      bind(DocumentsTypes.DocumentsLocal).to(DocumentsLocal);
      bind(DocumentsTypes.Documents).to(Documents);
    }

    submodules = [
      graphQlSchemaModule(documentsTypeDefs, {}),
      i18nModule('documents', { en: en }),
      sourcesModule(
        documentsRemotes.map(remote => ({
          symbol: DocumentsTypes.DocumentsRemote,
          source: remote
        }))
      ),
      elementsModule({
        'documents-text-node': TextNodeLens
      }),
      patternsModule({
        [DocumentsTypes.TextNodeEntity]: [TextNodeActions, TextNodeCreate, TextNodePatterns]
      })
    ];
  }

  return DocumentsModule;
}
