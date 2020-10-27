export interface IdentitySource {
  sourceId: string;
  publicKey: string;
  signText: (msg: string) => Promise<string>;
  verify: (msg: string, account: string) => Promise<boolean>;
}
