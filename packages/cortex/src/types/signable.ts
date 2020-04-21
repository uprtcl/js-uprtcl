export interface Proof {
  signature: string;
  type: string;
}

export interface Signed<T = any> {
  payload: T;
  proof: Proof;
}
