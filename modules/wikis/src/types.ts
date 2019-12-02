import { Node } from '@uprtcl/lenses';
import { CacheService } from '@uprtcl/cortex';

import { WikisProvider } from './services/wikis.provider';

export interface WikiNode {
  title: string;
  pages: Array<string>;
  type: 'Wiki';
}

export const WikisTypes = {
  Module: Symbol('wiki-module'),
  WikiPattern: Symbol('wiki-pattern'),
  WikiEntity: Symbol('wiki-entity'),
  WikisLocal: Symbol('wikis-local'),
  WikisRemote: Symbol('wikis-remote'),
  Wikis: Symbol('wikis'),
};

export type WikisLocal = CacheService & WikisProvider;
