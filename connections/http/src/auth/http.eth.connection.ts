import { HttpAuthenticatedConnection } from '../http.auth.connection';
import { HttpEthToken } from './http-eth-auth.token';

export class HttpEthConnection extends HttpAuthenticatedConnection {
  constructor(host: string) {
    super(host, new HttpEthToken(host), 'ETH_AUTH_TOKEN', 'ETH_USER_ID');
  }
}
