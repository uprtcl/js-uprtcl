import { Source } from '@uprtcl/multiplatform';

import { Wiki } from '../types';

export interface WikisProvider extends Source {
   createWiki(wiki: Wiki, hash?: string): Promise<string>;
}
