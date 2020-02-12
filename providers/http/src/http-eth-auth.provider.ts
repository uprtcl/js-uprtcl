
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { Logger } from '@uprtcl/micro-orchestrator';

import { HttpConnection } from './http.connection';
import { HttpProvider, HttpProviderOptions } from './http.provider';

export class HttpEthAuthProvider extends HttpProvider {

  logger = new Logger('HTTP-ETH-Provider');

  constructor(
    protected options: HttpProviderOptions, 
    protected connection: HttpConnection, 
    protected ethConnection: EthereumConnection) {

    super(options, connection);
  }

  async getNonce(userId: string) {
    return this.connection.get<string>(this.options.host + `/user/${userId}/nonce`);
  }

  async authorize(userId: string, signature: string) {
    return this.connection.getWithPut<{jwt: string}>(this.options.host + `/user/${userId}/authorize`, {signature});
  }

  async login(): Promise<void> {
    await this.ethConnection.ready();

    const account = this.ethConnection.accounts[0];
    let nonce = await this.getNonce(account);
    let signature = await this.ethConnection.signText(`Login to Uprtcl Evees HTTP Server \n\nnonce:${nonce}`, account);
    let token = await this.authorize(account, signature);

    this.connection.userId = account;
    this.connection.authToken = 'Bearer ' + token.jwt;
  }
}
