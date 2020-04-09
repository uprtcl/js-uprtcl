import { StoresModule, Store } from '@uprtcl/multiplatform';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { ElementsModule, i18nextModule, MicroModule } from '@uprtcl/micro-orchestrator';

import {
  TextNodeFieldsCreate,
  TextNodeFieldsPatterns,
  TextNodeFieldsTitle
} from './patterns/text-node-fields.entity';
import { documentsTypeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

import en from './i18n/en.json';
import { DocumentsFieldsBindings } from './bindings';
import { DocumentTextNodeFields } from './elements/document-text-node-fields';

/**
 * Configure a documents module with the given stores
 *
 * Depends on these modules being present: LensesModule, CortexModule, DiscoveryModule, i18nBaseModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsConnection } from '@uprtcl/ipfs-provider';
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
 * await orchestrator.loadModule(docs);
 * ```
 *
 * @category CortexModule
 *
 * @param stores an array of stores where documents can be put and retrieved
 */
export class DocumentsFieldsModule extends MicroModule {
  static id = Symbol('documents-fields-module');

  static bindings = DocumentsFieldsBindings;

  constructor(protected stores: Store[]) {
    super();
  }

  async onLoad() {}

  submodules = [
    new GraphQlSchemaModule(documentsTypeDefs, resolvers),
    new i18nextModule('documents-fields', { en: en }),
    new StoresModule(
      this.stores.map(store => ({
        symbol: DocumentsFieldsModule.bindings.DocumentsFieldsRemote,
        store: store
      }))
    ),
    new ElementsModule({
      'documents-text-node-fields': DocumentTextNodeFields
    }),
    new PatternsModule({
      [DocumentsFieldsModule.bindings.TextNodeFieldsEntity]: [
        TextNodeFieldsCreate,
        TextNodeFieldsPatterns,
        TextNodeFieldsTitle
      ]
    })
  ];
}
