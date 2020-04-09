import { interfaces } from 'inversify';

import { CASModule, CASStore } from '@uprtcl/multiplatform';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { i18nextModule, MicroModule } from '@uprtcl/micro-orchestrator';
import { EveesContentModule } from '@uprtcl/evees';

import { DocumentTextNode } from './elements/document-text-node';
import {
  TextNodeCreate,
  TextNodeCommon,
  TextNodeTitle,
  TextNodePattern
} from './patterns/text-node.pattern';
import { documentsTypeDefs } from './graphql/schema';

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
export class DocumentsModule extends EveesContentModule {
  static id = 'documents-module';

  static bindings = DocumentsBindings;

  providerIdentifier = DocumentsBindings.DocumentsRemote;

  async onLoad(container: interfaces.Container) {
    super.onLoad(container);
    customElements.define('documents-text-node', DocumentTextNode);
    customElements.define('documents-text-node-editor', DocumentTextNodeEditor);
  }

  get submodules() {
    return [
      ...super.submodules,
      new GraphQlSchemaModule(documentsTypeDefs, {}),
      new i18nextModule('documents', { en: en }),
      new PatternsModule([new TextNodePattern([TextNodeCreate, TextNodeCommon, TextNodeTitle])])
    ];
  }
}
