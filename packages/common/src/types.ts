export interface Context {
  creatorId: string;
  timestamp: number;
  nonce: number;
}

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

/** Type reexport */
export { LinkedPattern } from '@uprtcl/cortex';
