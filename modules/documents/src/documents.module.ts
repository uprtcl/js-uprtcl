import { interfaces } from 'inversify';

import { CASModule, CASStore } from '@uprtcl/multiplatform';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { i18nextModule, MicroModule } from '@uprtcl/micro-orchestrator';

import { DocumentTextNode } from './elements/document-text-node';
import {
  TextNodeCreate,
  TextNodeCommon,
  TextNodeTitle,
  TextNodePattern
} from './patterns/text-node.pattern';
import { documentsTypeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

import en from './i18n/en.json';
import { DocumentTextNodeEditor } from './elements/prosemirror/documents-text-node-editor';
import { DocumentsBindings } from './bindings';

/**
 * Configure a documents module with the given stores
 *
 * Depends on these modules being present: LensesModule, CortexModule, DiscoveryModule, i18nBaseModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsStore } from '@uprtcl/ipfs-provider';
 * import { DocumentsModule } from '@uprtcl/documents';
 *
 * const ipfsStore = new IpfsStore({
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 * const docs = new DocumentsModule([ ipfsStore ]);
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

  constructor(protected stores: Array<CASStore | interfaces.ServiceIdentifier<CASStore>>) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    this.stores.forEach(storeOrId => {
      const store =
        typeof storeOrId === 'object' && (storeOrId as CASStore).casID
          ? (storeOrId as CASStore)
          : container.get(storeOrId as interfaces.ServiceIdentifier<CASStore>);

      container.bind<CASStore>(DocumentsModule.bindings.DocumentsRemote).toConstantValue(store);
    });
    customElements.define('documents-text-node', DocumentTextNode);
    customElements.define('documents-text-node-editor', DocumentTextNodeEditor);
  }

  submodules = [
    new GraphQlSchemaModule(documentsTypeDefs, resolvers),
    new i18nextModule('documents', { en: en }),
    new CASModule(this.stores.filter(store => (store as CASStore).casID) as CASStore[]),
    new PatternsModule([new TextNodePattern([TextNodeCreate, TextNodeCommon, TextNodeTitle])])
  ];
}
