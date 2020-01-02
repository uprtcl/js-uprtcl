// Required by inversify
import 'reflect-metadata';

export { TextNode, TextType } from './types';

export { DocumentsProvider } from './services/documents.provider';
export { DocumentsHolochain } from './services/providers/documents.holochain';
export { DocumentsIpfs } from './services/providers/documents.ipfs';
export { DocumentsHttp } from './services/providers/documents.http';

// Module
export { DocumentsModule } from './documents.module';
