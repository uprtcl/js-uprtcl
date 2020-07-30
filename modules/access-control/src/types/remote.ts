import { Ready } from '@uprtcl/multiplatform';

export interface Remote extends Ready {
  /**
   * The id is used to select the JS remote from the listed of available Remotes.
   * A path is used to addreess a given request to that remote.
   * The defaultPath is used to simplify "get" or "create"s operations that dont receive a path.
   */
  id: string;
  defaultPath: string;

  userId?: string | undefined;

  /* connect to a remote provider, does not needs to be logged-in and user-id can be undefined*/
  connect(): Promise<void>;
  /* checks if its connected */
  isConnected(): Promise<boolean>;
  /* disconnect */
  disconnect(): Promise<void>

  /** **checks** if the current userId is correctly logged in the remote */
  isLogged(): Promise<boolean>;
  /** sets userId  */
  login(): Promise<void>;
  /** removes userId (set it as undefined)  */
  logout(): Promise<void>;
}
