export interface IdentitySource {
  sourceId: string;
  publicKey: string;
  signText: (msg: string) => Promise<string>;
  verify: (msg: string, sig: string) => Promise<string>;
}
