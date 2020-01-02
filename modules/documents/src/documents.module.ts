import { interfaces } from 'inversify';

import { SourcesModule } from '@uprtcl/multiplatform';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/common';
import { ElementsModule, i18nextModule, MicroModule } from '@uprtcl/micro-orchestrator';

import { DocumentTextNode } from './elements/document-text-node';
import {
  TextNodeActions,
  TextNodeCreate,
  TextNodePatterns,
  TextNodeTitle
} from './patterns/text-node.entity';
import { DocumentsLocal } from './services/documents.local';
import { Documents } from './services/documents';
import { DocumentsRemote } from './services/documents.remote';
import { documentsTypeDefs } from './graphql';

import en from '../i18n/en.json';

/**
 * Configure a documents module with the given service providers
 *
 * Depends on these modules being present: LensesModule, CortexModule, DiscoveryModule, i18nBaseModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsConnection } from '@uprtcl/connections';
 * import { DocumentsModule, DocumentsIpfs } from '@uprtcl/documents';
 *
 * const ipfsConnection = new IpfsConnection({
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 *  const documentsProvider = new DocumentsIpfs(ipfsConnection);
 *
 * const docs = new DocumentsModule([ documentsProvider ]);
 * await orchestrator.loadModules({
 *   [DocumentsTypes.Module]: docs
 * });
 * ```
 *
 * @category CortexModule
 *
 * @param documentsRemote an array of remotes of documents
 */
export class DocumentsModule extends MicroModule {
  static id = Symbol('documents-module');

  static types = {
    TextNodeEntity: Symbol('text-node-entity'),
    DocumentsLocal: Symbol('documents-local'),
    DocumentsRemote: Symbol('documents-remote'),
    Documents: Symbol('documents')
  };

  constructor(protected documentsRemotes: DocumentsRemote[]) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container.bind(DocumentsModule.types.DocumentsLocal).to(DocumentsLocal);
    container.bind(DocumentsModule.types.Documents).to(Documents);
  }

  submodules = [
    new GraphQlSchemaModule(documentsTypeDefs, {}),
    new i18nextModule('documents', { en: en }),
    new SourcesModule(
      this.documentsRemotes.map(remote => ({
        symbol: DocumentsModule.types.DocumentsRemote,
        source: remote
      }))
    ),
    new ElementsModule({
      'documents-text-node': DocumentTextNode
    }),
    new PatternsModule({
      [DocumentsModule.types.TextNodeEntity]: [
        TextNodeActions,
        TextNodeCreate,
        TextNodePatterns,
        TextNodeTitle
      ]
    })
  ];
}
