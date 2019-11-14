import { Source } from '@uprtcl/cortex';
import { WikiNode } from '../types';

export interface WikisProvider extends Source {
   createWikiNode(node: WikiNode, hash?: string): Promise<string>;
}
