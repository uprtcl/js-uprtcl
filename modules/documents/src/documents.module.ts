import { injectable } from 'inversify';

import { DiscoverableSource, CortexModule } from '@uprtcl/cortex';

import { TextNodeLens } from './lenses/text-node.lens';
import { TextNodePattern } from './patterns/text-node.pattern';
import { DocumentsTypes } from './types';
import { DocumentsProvider } from './services/documents.provider';

export function documentsModule(documentsProvider: DiscoverableSource<DocumentsProvider>): any {
  @injectable()
  class DocumentsModule extends CortexModule {
    get sources() {
      return [{ symbol: DocumentsTypes.DocumentsProvider, source: documentsProvider }];
    }

    get elements() {
      return [{ name: 'text-node', element: TextNodeLens }];
    }

    get patterns() {
      return [{ symbol: DocumentsTypes.TextNodePattern, pattern: TextNodePattern }];
    }
  }

  return DocumentsModule;
}
