import { StoresModule, Store } from '@uprtcl/multiplatform';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { i18nextModule, MicroModule } from '@uprtcl/micro-orchestrator';

import {
  TextNodePatterns,
  TextNodeTitle
} from './patterns/text-node.entity';
import { documentsTypeDefs } from './graphql/schema';

import en from './i18n/en.json';
import { DocumentTextNodeEditor } from './elements/prosemirror/documents-text-node-editor';
import { DocumentsBindings } from './bindings';
import { DocumentEditor } from './elements/document-editor';
import { TextNodeDiff } from './elements/document-text-node-diff';

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
export class DocumentsModule extends MicroModule {
  static id = 'documents-module';

  static bindings = DocumentsBindings;

  constructor(protected stores: Store[]) {
    super();
  }

  async onLoad() {
    customElements.define('documents-text-node-editor', DocumentTextNodeEditor);
    customElements.define('documents-editor', DocumentEditor);
    customElements.define('documents-text-node-diff', TextNodeDiff);
  }

  submodules = [
    new GraphQlSchemaModule(documentsTypeDefs),
    new i18nextModule('documents', { en: en }),
    new StoresModule(
      this.stores.map((store) => ({
        symbol: DocumentsModule.bindings.DocumentsRemote,
        store: store,
      }))
    ),
    new PatternsModule({
      [DocumentsModule.bindings.TextNodeEntity]: [TextNodePatterns, TextNodeTitle],
    }),
  ];
}
