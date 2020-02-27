import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

import { Authority } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { EthereumConnection } from './ethereum.connection';

export interface EthereumContractOptions {
  contract: {
    abi: AbiItem[] | AbiItem;
    networks: { [key: string]: { address: string } };
  };
  contractAddress?: string;
}

export class EthereumContract {
  logger = new Logger('EthereumContract');
  contractInstance!: Contract;

  constructor(
    protected options: EthereumContractOptions,
    protected connection: EthereumConnection
  ) {}

  get userId () {
    return this.connection.getCurrentAccount();
  }

  async ready() {
    await this.connection.ready();

    const contractAddress =
      this.options.contractAddress ||
      this.options.contract.networks[this.connection.networkId].address;

    this.contractInstance = new this.connection.web3.eth.Contract(
      this.options.contract.abi,
      contractAddress
    );
  }

  /**
   * Calls a method of the holding contract and resolves only when confirmed
   */
  public send(funcName: string, pars: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let gasEstimated = await this.contractInstance.methods[funcName](...pars).estimateGas()

      let sendPars = {
        from: this.connection.getCurrentAccount(),
        gas: gasEstimated*1.5
      };
      this.logger.log(`CALLING ${funcName}`, pars, sendPars);

      this.contractInstance.methods[funcName](...pars)
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
            this.logger.log(`CONFIRMED ${funcName}`, { confirmationNumber, pars });
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
    return this.contractInstance.methods[funcName](...pars).call({
      from: this.connection.getCurrentAccount()
    });
  }
}
