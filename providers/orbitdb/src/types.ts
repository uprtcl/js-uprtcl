export interface OrbitDBConnectionOptions {
  directory?: string;
  peerId?: string;
  keystore?: any;
  cache?: any;
  identity?: any;
  offline?: boolean;
}

export interface CustomStore {
  customType: string;
  type: string;
  name: (entity: any) => any;
  options: (entity: any) => any;
}
