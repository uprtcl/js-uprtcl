import { Ready } from './ready';

export interface Authority extends Ready {
  /**
   * The provider locator for this service
   * This should uniquely identify the provider from with to do requests
   */
  authority: string;

  userId?: string | undefined;

  /** **checks** if the current userId is correctly logged in the remote */
  isLogged: () => boolean;

  /** sets userId  */
  login: () => void;

  /** removes userId (set it as undefined)  */
  logout: () => void;
}
