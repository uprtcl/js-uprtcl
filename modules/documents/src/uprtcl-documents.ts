// Required by inversify
import 'reflect-metadata';

export { TextNode, TextType } from './types';
export { DocumentsBindings } from './bindings';

export { htmlToText } from './support/documents.support';

// Patterns
export { TextNodePattern, TextNodeCommon, TextNodeTitle } from './patterns/text-node.pattern';

// Module
export { DocumentsModule } from './documents.module';
