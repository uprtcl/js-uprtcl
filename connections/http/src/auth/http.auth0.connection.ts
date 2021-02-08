import { Auth0ClientOptions } from '@auth0/auth0-spa-js';
import { HttpAuthenticatedConnection } from '../http.auth.connection';
import { HttpAuth0Token } from './http-auth0.token';

export class HttpAuth0Connection extends HttpAuthenticatedConnection {
  constructor(host: string, auth0Config: Auth0ClientOptions) {
    super(host, new HttpAuth0Token(auth0Config), 'AUTH0_AUTH_TOKEN', 'AUTH0_USER_ID');
  }

  async isLogged() {
    if (!this.authentication) return false;

    const auth0TokenService = this.authentication as HttpAuth0Token;
    if (auth0TokenService.checkLoginCallback()) {
      const token = await auth0TokenService.parseLoginResult();

      if (token.jwt && token.userId) {
        this.tokenStore.authToken = 'Bearer ' + token.jwt;
        this.tokenStore.userId = token.userId;
        return true;
      } else {
        throw new Error('Token details not retrieved');
      }
    }

    return super.isLogged();
  }
}
