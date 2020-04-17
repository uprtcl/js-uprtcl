
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
    protected ethConnection: EthereumConnection) {

    super(options, connection);
  }

  /** connect to the ethConnection */
  async connect() {
    await this.ethConnection.ready();
    this.account = this.ethConnection.accounts[0].toLocaleLowerCase();
  }

  isConnected() {
    return this.account !== undefined;
  }

  async getNonce() {
    return this.connection.get<string>(this.options.host + `/user/${this.account}/nonce`);
  }

  async authorize(signature: string) {
    return this.connection.getWithPut<{jwt: string}>(this.options.host + `/user/${this.account}/authorize`, {signature});
  }

  async isAuthorized() {
    if (!this.account) throw Error('Ethereum account is not yet specified');
    return this.connection.get<boolean>(this.options.host + `/user/${this.account}/isAuthorized`);
  }

  async logout(): Promise<void> {
    this.connection.userId = undefined;
    this.connection.authToken = undefined;
  }

  async login(): Promise<void> {
    if (!this.account) throw Error('Ethereum account is not yet specified');

    const currentToken = this.connection.authToken;

    if (currentToken !== undefined) {
      let isAuthorized = false;
      try {
        isAuthorized = await this.isAuthorized();
        this.connection.userId = this.account;
        if (isAuthorized) return;
      } catch (e) {
        this.connection.authToken = undefined;
      }
    }

    const nonce = await this.getNonce();
    const signature = await this.ethConnection.signText(`Login to Uprtcl Evees HTTP Server \n\nnonce:${nonce}`, this.account);
    const token = await this.authorize(signature);

    this.connection.userId = this.account;
    this.connection.authToken = 'Bearer ' + token.jwt;
  }
}
