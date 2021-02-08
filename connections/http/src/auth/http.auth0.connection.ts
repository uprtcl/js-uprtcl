import { Auth0ClientOptions } from '@auth0/auth0-spa-js';
import { HttpAuthenticatedConnection } from '../http.auth.connection';
import { HttpAuth0Token } from './http-auth0.token';

export class HttpAuth0Connection extends HttpAuthenticatedConnection {
  constructor(host: string, auth0Config: Auth0ClientOptions) {
    super(host, new HttpAuth0Token(auth0Config), 'AUTH0_AUTH_TOKEN', 'AUTH0_USER_ID');
  }
}
