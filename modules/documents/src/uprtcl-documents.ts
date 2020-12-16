// Required by inversify
import 'reflect-metadata';

export {
  TextNode,
  TextType,
  CustomBlock,
  CustomBlocks,
  DocNode,
  DocNodeEventsHandlers,
} from './types';
export { DocumentsBindings } from './bindings';

export { htmlToText } from './support/documents.support';

// Patterns
export {
  TextNodePattern,
  TextNodeCommon,
  TextNodeTitle,
} from './patterns/text-node.pattern';

export { DocNodeLens } from './patterns/document-patterns';

// Module
export { DocumentsModule } from './documents.module';
