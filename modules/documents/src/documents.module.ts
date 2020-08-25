import { interfaces } from 'inversify';

import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { i18nextModule } from '@uprtcl/micro-orchestrator';
import { EveesContentModule } from '@uprtcl/evees';
import { CommonUIModule } from '@uprtcl/common-ui';

import {
  TextNodeCommon,
  TextNodeTitle,
  TextNodePattern,
} from './patterns/text-node.pattern';
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
 * @param stores an array of CASStores in which the documents objects can be stored/retrieved from
 */
export class DocumentsModule extends EveesContentModule {
  static id = 'documents-module';

  static bindings = DocumentsBindings;

  providerIdentifier = DocumentsBindings.DocumentsRemote;

  async onLoad(container: interfaces.Container) {
    super.onLoad(container);
    customElements.define('documents-text-node-editor', DocumentTextNodeEditor);
    customElements.define('documents-editor', DocumentEditor);
    customElements.define('documents-text-node-diff', TextNodeDiff);
  }

  get submodules() {
    return [
      ...super.submodules,
      new GraphQlSchemaModule(documentsTypeDefs, {}),
      new i18nextModule('documents', { en: en }),
      new PatternsModule([
        new TextNodePattern([TextNodeCommon, TextNodeTitle]),
      ]),
      new CommonUIModule(),
    ];
  }
}
