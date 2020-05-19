export interface CidConfig {
  base?: string;
  version: 0 | 1;
  codec: string;
  type: string;
}

export const defaultCidConfig: CidConfig = {
  version: 1,
  type: 'sha2-256',
  codec: 'raw',
  base: 'base58btc',
};
