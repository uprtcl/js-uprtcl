import { injectable } from 'inversify';

import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { Logger } from '@uprtcl/micro-orchestrator';

import { HttpConnection } from './http.connection';
import { HttpProvider, HttpProviderOptions } from './http.provider';

@injectable()
export class HttpEthAuthProvider extends HttpProvider {
  logger = new Logger('HTTP-ETH-Provider');

  account: string | undefined = undefined;

  constructor(
    protected options: HttpProviderOptions,
    protected connection: HttpConnection,
    protected ethConnection: EthereumConnection
  ) {
    super(options, connection);
  }

  async connect() {
    await this.ethConnection.ready();

    /** keep a copy of the current ethConnection account */
    this.account = this.ethConnection.accounts[0].toLocaleLowerCase();

    const currentUserId = this.userId;

    if (currentUserId !== undefined) {
      if (currentUserId !== this.account) {
        await this.logout();
      }
    }

    /** chech if HTTP authToken is available */
    const currentToken = this.connection.authToken;

    if (currentToken !== undefined) {
      try {
        /** if there is a token, check if the token is valid */
        const isAuthorized = await this.isLogged();
        if (!isAuthorized) this.logout();
      } catch (e) {
        this.connection.authToken = undefined;
      }
    }
  }

  async isLogged() {
    if (this.userId === undefined) return false;
    return this.connection.get<boolean>(this.options.host + `/user/isAuthorized`);
  }

  async getNonce() {
    if (this.account === undefined) throw Error('account undefined');
    return this.connection.get<string>(this.options.host + `/user/${this.account}/nonce`);
  }

  async authorize(signature: string) {
    if (this.account === undefined) throw Error('account undefined');
    return this.connection.getWithPut<{ jwt: string }>(
      this.options.host + `/user/${this.account}/authorize`,
      { signature }
    );
  }

  async logout(): Promise<void> {
    this.connection.userId = undefined;
    this.connection.authToken = undefined;
  }

  async login(): Promise<void> {
    if (this.account === undefined) throw Error('account undefined');

    const nonce = await this.getNonce();
    const signature = await this.ethConnection.signText(
      `Login to Uprtcl Evees HTTP Server \n\nnonce:${nonce}`,
      this.account
    );
    const token = await this.authorize(signature);

    this.connection.userId = this.account;
    this.connection.authToken = 'Bearer ' + token.jwt;
  }
}
