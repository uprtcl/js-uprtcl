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
    public pOptions: HttpProviderOptions,
    protected ethConnection: EthereumConnection
  ) {
    super(pOptions);
  }

  async connect() {
    await this.ethConnection.ready();

    /** keep a copy of the current ethConnection account */
    this.account = this.ethConnection.getCurrentAccount();

    const currentUserId = this.userId;

    if (currentUserId !== undefined) {
      if (currentUserId !== this.account) {
        await this.logout();
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
    if (this.userId === undefined) return false;
    return super.get<boolean>(this.pOptions.host + `/user/isAuthorized`);
  }

  async getNonce() {
    if (this.account === undefined) throw Error('account undefined');
    return super.get<string>(
      this.pOptions.host + `/user/${this.account}/nonce`
    );
  }

  async authorize(signature: string) {
    if (this.account === undefined) throw Error('account undefined');
    return super.getWithPut<{ jwt: string }>(
      this.pOptions.host + `/user/${this.account}/authorize`,
      { signature }
    );
  }

  async logout(): Promise<void> {
    super.userId = undefined;
    super.authToken = undefined;
  }

  async login(): Promise<void> {
    if (!this.ethConnection.canSign()) {
      await this.ethConnection.connectWallet();
      await this.connect();
    }

    if (this.account === undefined || this.account === '')
      throw Error('account undefined');

    const nonce = await this.getNonce();
    const signature = await this.ethConnection.signText(
      `Login to Uprtcl Evees HTTP Server \n\nnonce:${nonce}`,
      this.account
    );
    const token = await this.authorize(signature);

    super.userId = this.account;
    super.authToken = 'Bearer ' + token.jwt;
  }
  async isConnected(): Promise<boolean> {
    return true;
  }
  async disconnect(): Promise<void> {}
}
