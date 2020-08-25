import { ethers } from 'ethers';
import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';

export interface EthereumConnectionOptions {
  provider?: any;
}
export class EthereumConnection extends Connection {
  provider!: ethers.providers.JsonRpcProvider;
  signer!: ethers.providers.JsonRpcSigner;

  account!: string;
  private network!: ethers.providers.Network;
  private networkId!: string;

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

    if (this.ethOptions.provider) {
      this.provider = this.ethOptions.provider;
    } else if (typeof windowEthereum !== 'undefined') {
      this.provider = new ethers.providers.Web3Provider(windowEthereum);
      this.signer = this.provider.getSigner();

      windowEthereum.on('accountsChanged', (accounts) => {
        window.location.reload();
      });
    } else {
      this.provider = new ethers.providers.JsonRpcProvider(
        'http://localhost:8545'
      );
    }

    this.account = this.signer ? await this.signer.getAddress() : '';
    this.network = await this.provider.getNetwork();
    this.networkId = await this.provider.send('net_version', []);
  }

  /**
   * @returns the current used account for this ethereum connection
   */
  public getCurrentAccount(): string {
    return this.account.toLowerCase();
  }

  public getNetworkId(): string {
    return this.networkId;
  }

  public async signText(text: string, account: string): Promise<string> {
    return this.signer.signMessage(text);
  }
}
