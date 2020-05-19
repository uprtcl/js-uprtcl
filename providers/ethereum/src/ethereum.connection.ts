import Web3 from 'web3';
import { provider } from 'web3-core';

import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';

export interface EthereumConnectionOptions {
  provider?: provider;
}

const safeSend = (provider, data): Promise<any> => {
  const send = (Boolean(provider.sendAsync) ? provider.sendAsync : provider.send).bind(provider);
  return new Promise((resolve, reject) => {
    send(data, function (err, result) {
      if (err) reject(err);
      else if (result.error) reject(result.error);
      else resolve(result.result);
    });
  });
};

const encodeRpcCall = (method, params, fromAddress) => ({
  jsonrpc: '2.0',
  id: 1,
  method,
  params,
  fromAddress,
});

const callRpc = async (provider, method, params, fromAddress): Promise<string> =>
  safeSend(provider, encodeRpcCall(method, params, fromAddress));

export class EthereumConnection extends Connection {
  provider: any;
  web3!: Web3;
  accounts!: string[];
  networkId!: number;

  constructor(protected ethOptions: EthereumConnectionOptions, options?: ConnectionOptions) {
    super(options);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    let provider = window['ethereum'];

    if (this.ethOptions.provider) {
      this.web3 = new Web3(this.ethOptions.provider);
    } else if (typeof provider !== 'undefined') {
      this.accounts = await provider.enable();

      this.web3 = new Web3(provider);

      provider.on('accountsChanged', (accounts) => {
        if (accounts != this.accounts) {
          // Time to reload your interface with accounts[0]!
          window.location.reload();
        }
      });
    } else {
      throw new Error('No available web3 provider was found');
    }

    this.accounts = await this.web3.eth.getAccounts();
    this.networkId = await this.web3.eth.net.getId();
  }

  /**
   * @returns the current used account for this ethereum connection
   */
  public getCurrentAccount(): string {
    return this.accounts[0].toLowerCase();
  }

  public async signText(text: string, account: string): Promise<string> {
    const provider = this.web3.currentProvider;
    if (!provider) throw new Error('Ethereum provider not found');

    if ((provider as any).isAuthereum) return (provider as any).signMessageWithAdminKey(text);
    var msg = '0x' + Buffer.from(text, 'utf8').toString('hex');
    var params = [msg, account];
    var method = 'personal_sign';
    return callRpc(provider, method, params, account);
  }
}
