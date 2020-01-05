import { Source } from '@uprtcl/multiplatform';

import { TextNode } from '../types';

export interface DocumentsProvider extends Source {
  createTextNode(node: TextNode, hash?: string): Promise<string>;
}
