// Required by inversify
import 'reflect-metadata';

export { TextNode, TextType } from './types';
export { DocumentsBindings } from './bindings';

export { DocumentsProvider } from './services/documents.provider';
export { DocumentsHolochain } from './services/providers/documents.holochain';
export { DocumentsIpfs } from './services/providers/documents.ipfs';
export { DocumentsHttp } from './services/providers/documents.http';

export { htmlToText } from './support/documents.support';

// Module
export { DocumentsModule } from './documents.module';

export { CREATE_TEXT_NODE } from './graphql/queries';


