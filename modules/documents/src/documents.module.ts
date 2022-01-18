import { EveesContentModule } from '@uprtcl/evees';

import { registerComponents } from './block-based-elements/register.components';
import { TextNodeCommon, TextNodeTitle, TextNodePattern } from './patterns/text-node.pattern';
import { CustomBlocks } from './types';

export interface DocumentsModuleConfig {
  customBlocks?: CustomBlocks;
}

export class DocumentsModule implements EveesContentModule {
  static id = 'documents-module';
  config: DocumentsModuleConfig;

  constructor(protected customBlocks?: CustomBlocks) {
    this.config = { customBlocks };
  }

  async registerComponents() {
    registerComponents();
  }

  getPatterns() {
    return [new TextNodePattern([new TextNodeCommon(), new TextNodeTitle()])];
  }
}
