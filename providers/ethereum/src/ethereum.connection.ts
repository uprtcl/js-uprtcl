import { ethers } from 'ethers';
import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';

export interface EthereumConnectionOptions {
  provider?: any;
}
export class EthereumConnection extends Connection {
  provider!: ethers.providers.Web3Provider;
  signer!: ethers.providers.JsonRpcSigner;

  account!: string;
  network!: ethers.providers.Network;

  constructor(
    protected ethOptions: EthereumConnectionOptions,
    options?: ConnectionOptions
  ) {
    super(options);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    let windowEthereum = window['ethereum'];

    debugger;

    if (this.ethOptions.provider) {
      this.provider = this.ethOptions.provider;
    } else if (typeof windowEthereum !== 'undefined') {
      this.provider = new ethers.providers.Web3Provider(windowEthereum);
      this.signer = this.provider.getSigner();

      windowEthereum.on('accountsChanged', (accounts) => {
        window.location.reload();
      });
    } else {
      throw new Error('No available web3 provider was found');
    }

    this.account = await this.signer.getAddress();
    this.network = await this.provider.getNetwork();
  }

  /**
   * @returns the current used account for this ethereum connection
   */
  public getCurrentAccount(): string {
    return this.account.toLowerCase();
  }

  public async signText(text: string, account: string): Promise<string> {
    return this.signer.signMessage(text);
  }
}
