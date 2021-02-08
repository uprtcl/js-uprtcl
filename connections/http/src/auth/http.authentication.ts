export interface JwtToken {
  userId: string;
  jwt: string;
}

/** Abtraction for JWT token providers */
export interface HttpAuthentication {
  obtainToken(): Promise<JwtToken>;
}
