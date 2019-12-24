import { Source } from '@uprtcl/cortex';
import { Wiki } from '../types';

export interface WikisProvider extends Source {
   createWiki(wiki: Wiki, hash?: string): Promise<string>;
}
