import Web3 from 'web3';
import { provider } from 'web3-core';

import { Connection, ConnectionOptions } from '../../connections/connection';

export interface EthereumConnectionOptions {
  provider: provider;
}

export class EthereumConnection extends Connection {
  web3!: Web3;
  accounts!: string[];
  networkId!: number;

  constructor(protected ethOptions: EthereumConnectionOptions, options: ConnectionOptions) {
    super(options);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    this.web3 = new Web3(this.ethOptions.provider);

    const setAccounts = (accounts: string[]) => (this.accounts = accounts);

    const web3 = this.web3;

    setInterval(async function() {
      const accounts = await web3.eth.getAccounts();
      setAccounts(accounts);
    }, 100);

    this.accounts = await this.web3.eth.getAccounts();
    this.networkId = await this.web3.eth.net.getId();

  }

  /**
   * @returns the current used account for this ethereum connection
   */
  public getCurrentAccount(): string {
    return this.accounts[0];
  }
}
