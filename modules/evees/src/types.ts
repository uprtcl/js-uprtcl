import { Hashed, CacheService } from '@uprtcl/cortex';

import { EveesProvider } from './services/evees.provider';

export type Context = string;

export interface Perspective {
  origin: string;
  creatorId: string;
  timestamp: number;
}

export interface PerspectiveDetails {
  name: string;
  context: string | undefined;
  headId: string | undefined;
}

export interface Commit {
  creatorsIds: string[];
  timestamp: number;
  message: string | undefined;
  parentsIds: Array<string>;
  dataId: string;
}

export interface UpdateRequest {
  fromPerspectiveId: string | undefined;
  oldHeadId: string | undefined;
  perspectiveId: string;
  newHeadId: string;
}

export interface Proposal {
  timestamp: number;
  creatorId: string;
  requests: Array<UpdateRequest>;
}

export const EveesTypes = {
  Module: Symbol('evees-module'),
  PerspectivePattern: Symbol('perspective-pattern'),
  CommitPattern: Symbol('commit-pattern'),
  ContextPattern: Symbol('context-pattern'),
  EveesLocal: Symbol('evees-local'),
  EveesRemote: Symbol('evees-remote'),
  MergeStrategy: Symbol('merge-strategry'),
  Evees: Symbol('evees')
};

export type EveesLocal = CacheService & EveesProvider;
