import { injectable } from 'inversify';
import { Auth0Client, Auth0ClientOptions } from '@auth0/auth0-spa-js';

import { Logger } from '@uprtcl/micro-orchestrator';

import { HttpProvider, HttpProviderOptions } from './http.provider';

@injectable()
export class HttpAuth0Provider extends HttpProvider {
  logger = new Logger('HTTP-AUTH0-Provider');

  account: string | undefined = undefined;

  auth0: Auth0Client;

  constructor(public pOptions: HttpProviderOptions, auth0Config: Auth0ClientOptions) {
    super(pOptions);

    this.auth0 = new Auth0Client(auth0Config);
  }

  async connect() {
    const currentUserId = super.userId;

    if (currentUserId !== undefined) {
      try {
        const isAuthorized = await this.isLogged();
        if (isAuthorized) {
          const user = await this.auth0.getUser();

          if (!user) throw new Error('User not found in auth0');

          if (currentUserId !== user.sub) {
            this.logout();
          }
        } else {
          this.logout();
        }
      } catch (e) {
        super.userId = undefined;
      }
    }

    /** chech if HTTP authToken is available */
    const currentToken = super.authToken;

    if (currentToken !== undefined) {
      try {
        /** if there is a token, check if the token is valid */
        const isAuthorized = await this.isLogged();
        if (!isAuthorized) this.logout();
      } catch (e) {
        super.authToken = undefined;
      }
    }
  }

  async isLogged() {
    if (super.userId === undefined) return false;
    return this.auth0.isAuthenticated();
  }

  async logout(): Promise<void> {
    try {
      this.auth0.logout({
        returnTo: window.location.origin,
      });
    } catch (err) {
      console.log('Log out failed', err);
    }

    super.userId = undefined;
    super.authToken = undefined;
  }

  async parseLoginResult() {
    try {
      const result = await this.auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        const user = await this.auth0.getUser();
        if (!user) throw new Error('User not found in auth0');

        const auth0Claims = await this.auth0.getIdTokenClaims();

        super.userId = user.sub;
        super.authToken = 'Bearer ' + auth0Claims.__raw;

        const url = window.location.origin + window.location.pathname;

        window.history.replaceState({}, document.title, url);
      }
    } catch (err) {
      console.log('Error parsing redirect:', err);
    }
  }

  async makeLoginRedirect() {
    try {
      const isAuthenticated = await this.isLogged();

      if (!isAuthenticated) {
        const url = window.location.origin + window.location.pathname;

        const options = {
          redirect_uri: url,
          appState: { targetUrl: url },
        };

        await this.auth0.loginWithRedirect(options);
      }
    } catch (err) {
      console.log('Log in failed', err);
    }
  }

  async login(): Promise<void> {
    const query = window.location.search;
    const shouldParseResult = query.includes('code=') && query.includes('state=');

    if (shouldParseResult) {
      this.parseLoginResult();
    } else {
      this.makeLoginRedirect();
    }
  }

  isConnected(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
