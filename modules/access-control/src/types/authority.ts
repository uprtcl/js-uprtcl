import { Ready } from './ready';

export interface Authority extends Ready {
  /**
   * The provider locator for this service
   * This should uniquely identify the provider from which to do requests
   */
  authority: string;

  userId?: string | undefined;

  /** **checks** if the current userId is correctly logged in the remote */
  isLogged(): Promise<boolean>;
  /** sets userId  */
  login(): Promise<void>;
  /** removes userId (set it as undefined)  */
  logout(): Promise<void>;
}
