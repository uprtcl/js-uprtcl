import { ethers, ContractInterface, Overrides } from 'ethers';

import { Logger } from '@uprtcl/micro-orchestrator';

import { EthereumConnection } from './ethereum.connection';

export interface EthereumContractOptions {
  contract: {
    abi: ContractInterface;
    networks: { [key: string]: { address: string } };
  };
  contractAddress?: string;
}

const MAX_GAS: number = 1000000;

export class EthereumContract {
  logger = new Logger('EthereumContract');
  contractInstance!: ethers.Contract;

  constructor(
    protected options: EthereumContractOptions,
    public connection: EthereumConnection
  ) {}

  get userId() {
    return this.connection.getCurrentAccount();
  }

  async ready() {
    await this.connection.ready();

    const contractAddress =
      this.options.contractAddress ||
      this.options.contract.networks[await this.connection.getNetworkId()].address;

    this.contractInstance = new ethers.Contract(
      contractAddress,
      this.options.contract.abi,
      this.connection.signer ? this.connection.signer : this.connection.provider
    );
  }

  /**
   * Calls a method of the holding contract and resolves only when confirmed
   */
  public async send(funcName: string, pars: any[]): Promise<any> {
    this.logger.log(`CALLING ${funcName}`, pars);
    const tx = await this.contractInstance[funcName](...pars);
    this.logger.log(`TX HASH ${funcName} `, { tx, pars });
    const receipt = await tx.wait();
    this.logger.log(`RECEIPT ${funcName} receipt`, { receipt, pars });
  }

  /**
   * Simple call function for the holding contract
   */
  public async call(funcName: string, pars: any[]): Promise<any> {
    return this.contractInstance[funcName](...pars);
  }
}
