export interface IdentitySource {
  sourceId: string;
  publicKey: string | undefined;
  signText: (msg: string) => Promise<string>;
  verify: (msg: string, sig: string) => Promise<string>;
}
