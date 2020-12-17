import { interfaces } from 'inversify';

import { PatternsModule } from '@uprtcl/cortex';
import { i18nextModule } from '@uprtcl/micro-orchestrator';
import { EveesContentModule } from '@uprtcl/evees';
import { CommonUIModule } from '@uprtcl/common-ui';

import {
  TextNodeCommon,
  TextNodeTitle,
  TextNodePattern,
} from './patterns/text-node.pattern';

import en from './i18n/en.json';
import { DocumentTextNodeEditor } from './elements/prosemirror/documents-text-node-editor';
import { DocumentsBindings } from './bindings';
import { DocumentEditor } from './elements/document-editor';
import { TextNodeDiff } from './elements/document-text-node-diff';
import { CustomBlocks } from './types';

export class DocumentsModule extends EveesContentModule {
  static id = 'documents-module';
  static bindings = DocumentsBindings;
  providerIdentifier = DocumentsBindings.DocumentsRemote;

  constructor(protected customBlocks?: CustomBlocks) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    super.onLoad(container);
    if (this.customBlocks) {
      container
        .bind(DocumentsBindings.CustomBlocks)
        .toConstantValue(this.customBlocks);
    }

    customElements.define('documents-text-node-editor', DocumentTextNodeEditor);
    customElements.define('documents-editor', DocumentEditor);
    customElements.define('documents-text-node-diff', TextNodeDiff);
  }

  get submodules() {
    return [
      ...super.submodules,
      new i18nextModule('documents', { en: en }),
      new PatternsModule([
        new TextNodePattern([TextNodeCommon, TextNodeTitle]),
      ]),
      new CommonUIModule(),
    ];
  }
}
