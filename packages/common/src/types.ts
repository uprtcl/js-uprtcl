import { UprtclProvider } from './uprtcl/services/uprtcl.provider';
import { CacheService, Hashed } from '@uprtcl/cortex';

export type Context = string;

export interface Perspective {
  origin: string;
  creatorId: string;
  timestamp: number;
  name: string;
}

export interface Commit {
  creatorId: string;
  timestamp: number;
  message: string;
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
