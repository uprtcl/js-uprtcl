import { injectable } from 'inversify';

import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { Logger } from '@uprtcl/micro-orchestrator';

import { HttpConnection } from './http.connection';
import { HttpProvider, HttpProviderOptions } from './http.provider';

@injectable()
export class HttpAuth0Provider extends HttpProvider {
  logger = new Logger('HTTP-ETH-Provider');

  account: string | undefined = undefined;

  constructor(
    protected options: HttpProviderOptions,
    protected connection: HttpConnection,
    protected auth0Connection: EthereumConnection // TODO: Use Auth0 connection
  ) {
    super(options, connection);
  }

  async isLogged() {
    if (this.userId === undefined) return false;
    return this.connection.get<boolean>(this.options.host + `/user/isAuthorized`);
  }

  async logout(): Promise<void> {
    this.connection.userId = undefined;
    this.connection.authToken = undefined;
  }

  async login(): Promise<void> {
    if (this.account === undefined) throw Error('account undefined');

    const nonce = await this.getNonce();
    const signature = await this.auth0Connection.signText(
      `Login to Uprtcl Evees HTTP Server \n\nnonce:${nonce}`,
      this.account
    );
    const token = await this.authorize(signature);

    this.connection.userId = this.account;
    this.connection.authToken = 'Bearer ' + token.jwt;
  }
}
