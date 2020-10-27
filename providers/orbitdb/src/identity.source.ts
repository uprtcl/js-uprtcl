export interface IdentitySource {
  sourceId: string;
  publicKey: string;
  signText: (msg: string) => Promise<string>;
}
