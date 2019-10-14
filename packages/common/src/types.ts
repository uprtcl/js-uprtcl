import { UprtclProvider } from './services/uprtcl.provider';
import { CacheService } from '@uprtcl/cortex';

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

export const UprtclTypes = {
  Module: Symbol('uprtcl-module'),
  PerspectivePattern: Symbol('perspective-pattern'),
  CommitPattern: Symbol('commit-pattern'),
  ContextPattern: Symbol('context-pattern'),
  UprtclCache: Symbol('uprtcl-cache'),
  UprtclProvider: Symbol('uprtcl-provider'),
  UprtclMultiplatform: Symbol('uprtcl-multiplatform')
};

export type UprtclCache = CacheService & UprtclProvider;
