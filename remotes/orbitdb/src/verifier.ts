export interface Verifier {
  verify(signature: string, key: string): Promise<boolean>;
}
