import { AuthTokenStorage } from './http.token.store';
import { HttpAuthentication, JwtToken } from './http.authentication';
import { Auth0Client, Auth0ClientOptions } from '@auth0/auth0-spa-js';

export const loginMessage = (nonce: string) => {
  return `Login to Intercreativity \n\nnonce:${nonce}`;
};

export class HttpAuth0Token implements HttpAuthentication {
  store: AuthTokenStorage;
  auth0: Auth0Client;

  constructor(auth0Config: Auth0ClientOptions) {
    this.store = new AuthTokenStorage('ETH_AUTH_TOKEN', 'ETH_USER_ID');
    this.auth0 = new Auth0Client(auth0Config);
  }

  async obtainToken(): Promise<JwtToken> {
    if (this.checkLoginCallback()) {
      return this.parseLoginResult();
    }

    const url = window.location.origin + window.location.pathname;

    const options = {
      redirect_uri: url,
      appState: { targetUrl: url },
    };

    await this.auth0.loginWithRedirect(options);

    /** It should never reach this plint (Auth0 redirects) */
    return { userId: '', jwt: '' };
  }

  checkLoginCallback(): boolean {
    const query = window.location.search;
    return query.includes('code=') && query.includes('state=');
  }

  async parseLoginResult(): Promise<JwtToken> {
    const result = await this.auth0.handleRedirectCallback();

    if (result.appState && result.appState.targetUrl) {
      const user = await this.auth0.getUser();
      if (!user) throw new Error('User undefined');

      const auth0Claims = await this.auth0.getIdTokenClaims();
      const url = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, url);

      if (!user.sub) throw new Error('user id undefined');

      return { userId: user.sub, jwt: 'Bearer ' + auth0Claims.__raw };
    }

    throw new Error('Error parsing redirect');
  }
}
