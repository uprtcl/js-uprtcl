import { ethers } from 'ethers';
import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';

export interface EthereumConnectionOptions {
  provider: string | ethers.providers.JsonRpcProvider;
}
export class EthereumConnection extends Connection {
  provider!: ethers.providers.JsonRpcProvider;
  signer!: ethers.providers.JsonRpcSigner | undefined;

  account!: string;
  private network!: ethers.providers.Network;
  private networkId!: string;

  constructor(
    protected ethOptions: EthereumConnectionOptions = {
      provider: 'http://localhost:8545'
    },
    options?: ConnectionOptions
  ) {
    super(options);
  }

  /**
   * @override
   */
  public async connect(): Promise<void> {
    if (typeof this.ethOptions.provider === 'string') {
      this.provider = new ethers.providers.JsonRpcProvider(this.ethOptions.provider);
    } else {
      this.provider = this.ethOptions.provider;
    }

    this.signer = undefined;
    this.account = '';

    this.network = await this.provider.getNetwork();
    this.networkId = this.provider.send
      ? await this.provider.send('net_version', [])
      : this.network.chainId;
  }

  public getLatestBlock() {
    return this.provider.getBlockNumber();
  }

  public async connectWallet() {
    await window['ethereum'].enable();
    const provider = new ethers.providers.Web3Provider(window['ethereum']);
    this.ethOptions = { provider };
    await this.connect();
    this.signer = this.provider.getSigner();
    const account = await this.signer.getAddress();
    this.account = this.signer ? account.toString() : '';
  }

  public async disconnectWallet() {
    await this.connect();
  }

  public canSign() {
    return !!this.signer;
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
    if (!this.signer) throw new Error('signer not set');
    return this.signer.signMessage(text);
  }

  public async verifySignature(message: string, signature: string): Promise<string> {
    return ethers.utils.verifyMessage(message, signature).toLocaleLowerCase();
  }
}
