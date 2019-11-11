import { NamedSource } from '@uprtcl/cortex';
import { TextNode } from '../types';

export interface DocumentsProvider extends NamedSource {
   createTextNode(node: TextNode): Promise<string>;
}
