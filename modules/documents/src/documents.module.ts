import { EveesContentModule } from '@uprtcl/evees';

import { TextNodeCommon, TextNodeTitle, TextNodePattern } from './patterns/text-node.pattern';

import { DocumentTextNodeEditor } from './elements/prosemirror/documents-text-node-editor';
import { DocumentEditor } from './elements/document-editor';
import { TextNodeDiff } from './elements/document-text-node-diff';
import { CustomBlocks } from './types';

export interface DocumentsModuleConfig {
  customBlocks?: CustomBlocks;
}

export class DocumentsModule extends EveesContentModule {
  static id = 'documents-module';
  config!: DocumentsModuleConfig;

  constructor(protected customBlocks?: CustomBlocks) {
    super();
    this.config.customBlocks = customBlocks;
  }

  async registerComponentes() {
    customElements.define('documents-text-node-editor', DocumentTextNodeEditor);
    customElements.define('documents-editor', DocumentEditor);
    customElements.define('documents-text-node-diff', TextNodeDiff);
  }

  getPatterns() {
    return [new TextNodePattern([TextNodeCommon, TextNodeTitle])];
  }
}
