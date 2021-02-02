import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { CASStore, Logger } from '@uprtcl/evees';
import { SearchEngine } from '@uprtcl/evees/dist/types/evees/interfaces/search.engine';
import { HttpConnectionLogged } from './connection.logged';
import { HttpConnection } from './http.connection';

export const loginMessage = (nonce: string) => {
  return `Login to Intercreativity \n\nnonce:${nonce}`;
};

export class HttpEthAuthConnection extends HttpConnection implements HttpConnectionLogged {
  logger = new Logger('HTTP-ETH-Connection');

  account: string | undefined = undefined;

  constructor(public host, protected ethConnection: EthereumConnection) {
    super(host);
  }

  store!: CASStore;
  searchEngine!: SearchEngine;

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
    return super.get<boolean>(`/user/isAuthorized`);
  }

  async getNonce() {
    if (this.account === undefined) throw Error('account undefined');
    return super.get<string>(`/user/${this.account}/nonce`);
  }

  async authorize(signature: string) {
    if (this.account === undefined) throw Error('account undefined');
    return super.getWithPut<{ jwt: string }>(`/user/${this.account}/authorize`, { signature });
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

    if (this.account === undefined || this.account === '') throw Error('account undefined');

    const nonce = await this.getNonce();
    const signature = await this.ethConnection.signText(loginMessage(nonce), this.account);
    const token = await this.authorize(signature);

    super.userId = this.account;
    super.authToken = 'Bearer ' + token.jwt;
  }
  async isConnected(): Promise<boolean> {
    return true;
  }
  async disconnect(): Promise<void> {}
}
