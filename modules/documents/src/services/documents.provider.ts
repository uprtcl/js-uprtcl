import { Source } from '@uprtcl/cortex';
import { TextNode } from '../types';

export interface DocumentsProvider extends Source {
   createTextNode(node: TextNode, hash?: string): Promise<string>;
}
