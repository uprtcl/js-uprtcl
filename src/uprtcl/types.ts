export interface Proof {
  signature: string;
}

export interface Signed {
  id: string;
  proof: Proof;
}

export interface Context {
  creatorId: string;
  timestamp: number;
  nonce: number;
}

export interface Perspective {
  origin: string;
  creatorId: string;
  timestamp: number;
  contextId: string;
  name: string;
}

export interface Commit {
  creatorId: string;
  timestamp: number;
  message: string;
  parentsIds: Array<string>;
  dataId: string;
}
