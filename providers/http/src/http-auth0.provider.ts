import { injectable } from 'inversify';
import { Auth0Client, Auth0ClientOptions } from '@auth0/auth0-spa-js';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Remote } from '@uprtcl/evees';

import { HttpProvider, HttpProviderOptions } from './http.provider';

@injectable()
export class HttpAuth0Provider extends HttpProvider {
  logger = new Logger('HTTP-AUTH0-Provider');

  account: string | undefined = undefined;

  isParsingData = false;
  
  auth0: Auth0Client;

  constructor(
    public pOptions: HttpProviderOptions,
    auth0Config: Auth0ClientOptions
  ) {
    super(pOptions);

    this.auth0 = new Auth0Client(auth0Config);
  }

  async connect() {
    /** check if HTTP currentUserId is available */
    const currentUserId = super.userId;

    if (currentUserId !== undefined) {
      try {
        const isAuthorized = await this.isLogged();
        if (isAuthorized) {
          const user = await this.auth0.getUser();

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

    /** check if HTTP authToken is available */
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

    /** check if url has code and state to login */
    const query = window.location.search;
    const shouldParseResult =
      query.includes('code=') && query.includes('state=');

    if (shouldParseResult) {
      await this.parseLoginResult();
    }
  }

  async isLogged() {
    if (super.userId === undefined) return false;
    return this.auth0.isAuthenticated();
  }

  async logout(): Promise<void> {
    try {
      const url = window.location.origin + '/home';
      
      this.auth0.logout({
        returnTo: url,
      });
    } catch (err) {
      console.log('Log out failed', err);
    }

    super.userId = undefined;
    super.authToken = undefined;
  }

  async parseLoginResult() {
    this.isParsingData = true;
    try {
      const result = await this.auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        
        const user = await this.auth0.getUser();
        const auth0Claims = await this.auth0.getIdTokenClaims();

        super.userId = user.sub;
        super.authToken = 'Bearer ' + auth0Claims.__raw;

        const url = window.location.origin + window.location.pathname;
        const targetUrl = result.appState.targetUrl;
        
        if(url === targetUrl) {
          window.history.replaceState({}, document.title, url);
        } else {
          window.location.replace(targetUrl);
        }
      }
    } catch (err) {
      console.log('Error parsing redirect:', err);
    }
    this.isParsingData = false;
  }

  async makeLoginRedirect() {
    try {
      const isAuthenticated = await this.isLogged();

      if (!isAuthenticated) {
        const url = window.location.origin + window.location.pathname;

        const options = {
          redirect_uri: window.location.origin + '/home',
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
    const shouldParseResult =
      query.includes('code=') && query.includes('state=');

    if(!this.isParsingData) {
      if (shouldParseResult) {
        this.parseLoginResult();
      } else {
        this.makeLoginRedirect();
      }
    }
  }

  isConnected(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
