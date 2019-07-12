export interface Hashed<T> {
  id: string;
  object: T;
}

export interface Proof {
  signature: string;
}

export interface Signed<T> {
  payload: T;
  proof: Proof;
}

export type Secured<T> = Hashed<Signed<T>>;
