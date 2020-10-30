export interface UserPerspectivesDetails {
  [perspectiveId: string]: {
    headId?: string;
  };
}

export interface RemoteStatus {
  pendingActions: number;
}

export interface RemoteUI {
  pendingActions: number;
}

export interface ChainConnectionDetails {
  [id: string]: {
    name: string;
    image: string;
    hostName: string;
    endpoint: string;
  };
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
