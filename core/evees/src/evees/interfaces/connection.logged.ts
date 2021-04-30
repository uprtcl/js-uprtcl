export enum ConnectionLoggedEvents {
  logged_out = 'logged_out',
  logged_in = 'logged_in',
  logged_status_changed = 'logged_status_changed',
}

export interface ConnectionLogged {
  userId?: string | undefined;

  /* connect to a remote provider, does not needs to be logged-in and user-id can be undefined*/
  connect(): Promise<void>;
  /* checks if its connected */
  isConnected(): Promise<boolean>;
  /* disconnect */
  disconnect(): Promise<void>;

  /** **checks** if the current userId is correctly logged in the remote */
  isLogged(): Promise<boolean>;
  /** sets userId  */
  login(): Promise<void>;
  /** removes userId (set it as undefined)  */
  logout(): Promise<void>;
}
