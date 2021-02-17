import { PerspectiveDetails } from '@uprtcl/evees';

export interface UserPerspectivesDetails {
  [perspectiveId: string]: PerspectiveDetails;
}

export interface RemoteStatus {
  pendingActions: number;
}

export interface RemoteUI {
  pendingActions: number;
}

export interface ConnectionDetails {
  name: string;
  image: string;
  hostName: string;
  endpoint: string;
}

export interface ChainConnectionDetails {
  [id: string]: ConnectionDetails;
}

export interface UpdatePerspectiveLocal {
  id: string;
  head: string;
}

export interface NewPerspectiveLocal {
  id: string;
  head?: string;
  context: string;
}
