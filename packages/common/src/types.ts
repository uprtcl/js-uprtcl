import { UprtclProvider } from './services/providers/uprtcl.provider';
import { CacheService, NamedSource } from '@uprtcl/cortex';

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
  UprtclLocal: Symbol('uprtcl-local'),
  UprtclRemote: Symbol('uprtcl-remote'),
  Uprtcl: Symbol('uprtcl')
};

export type UprtclLocal = CacheService & UprtclProvider;
export type UprtclRemote = NamedSource & UprtclProvider;
