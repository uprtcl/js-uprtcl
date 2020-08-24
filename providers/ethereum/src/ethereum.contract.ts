import { ethers, ContractInterface } from 'ethers';

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
      this.options.contract.networks[this.connection.network.chainId].address;

    this.contractInstance = new ethers.Contract(
      contractAddress,
      this.options.contract.abi,
      this.connection.signer
    );
  }

  /**
   * Calls a method of the holding contract and resolves only when confirmed
   */
  public send(funcName: string, pars: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.logger.log(`CALLING ${funcName}`, pars);

      const caller = this.contractInstance.methods[funcName];
      if (!caller) {
        throw new Error(`Function "${funcName}" not found on smart contract`);
      }

      const _from = this.connection.getCurrentAccount();

      let gasEstimated: number;

      gasEstimated = (await caller(...pars).estimateGas({ from: _from })) * 1.2;
      gasEstimated = gasEstimated > MAX_GAS ? MAX_GAS : gasEstimated;

      const sendPars = {
        from: _from,
        gas: Math.floor(gasEstimated),
      };

      caller(...pars)
        .send(sendPars)
        .once('transactionHash', (transactionHash: any) => {
          this.logger.info(`TX HASH ${funcName} `, { transactionHash, pars });
        })
        .on('receipt', (receipt: any) => {
          this.logger.log(`RECEIPT ${funcName} receipt`, { receipt, pars });
          resolve();
        })
        .on('error', (error: any) => {
          this.logger.error(`ERROR ${funcName} `, { error, pars });
          reject();
        })
        .on('confirmation', (confirmationNumber: any) => {
          if (confirmationNumber < 5) {
            this.logger.log(`CONFIRMED ${funcName}`, {
              confirmationNumber,
              pars,
            });
          }
          resolve();
        })
        .then((receipt: any) => {
          this.logger.log(`MINED ${funcName} call mined`, { pars, receipt });
          resolve();
        });
    });
  }

  /**
   * Simple call function for the holding contract
   */
  public async call(funcName: string, pars: any[]): Promise<any> {
    const caller = this.contractInstance.methods[funcName];

    if (!caller) {
      throw new Error(`Function "${funcName}" not found on smart contract`);
    }

    return caller(...pars).call({
      from: this.connection.getCurrentAccount(),
    });
  }
}
