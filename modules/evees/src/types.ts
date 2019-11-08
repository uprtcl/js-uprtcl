import { Hashed, CacheService } from '@uprtcl/cortex';

import { UprtclProvider } from './services/uprtcl.provider';

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
  perspectiveId: string;
  oldHeadId: string;
  newHeadId: string;
}

export interface Proposal {
  creatorId: string;
  requests: Array<Hashed<UpdateRequest>>;
  description: string | undefined;
}

export const UprtclTypes = {
  Module: Symbol('uprtcl-module'),
  PerspectivePattern: Symbol('perspective-pattern'),
  CommitPattern: Symbol('commit-pattern'),
  ContextPattern: Symbol('context-pattern'),
  UprtclLocal: Symbol('uprtcl-local'),
  UprtclRemote: Symbol('uprtcl-remote'),
  Uprtcl: Symbol('uprtcl')
};

export type UprtclLocal = CacheService & UprtclProvider;
