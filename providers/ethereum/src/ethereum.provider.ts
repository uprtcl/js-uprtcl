import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

import { Authority } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { EthereumConnection } from './ethereum.connection';

export interface EthereumProviderOptions {
  contract: {
    abi: AbiItem[] | AbiItem;
    networks: { [key: string]: { address: string } };
  };
  contractAddress?: string;
}

export abstract class EthereumProvider implements Authority {
  logger = new Logger('EthereumProvider');
  userId?: string | undefined;
  contractInstance!: Contract;

  constructor(
    protected ethOptions: EthereumProviderOptions,
    protected ethConnection: EthereumConnection
  ) {}

  abstract get authority(): string;

  async ready() {
    await this.ethConnection.ready();

    const contractAddress =
      this.ethOptions.contractAddress ||
      this.ethOptions.contract.networks[this.ethConnection.networkId].address;

    this.contractInstance = new this.ethConnection.web3.eth.Contract(
      this.ethOptions.contract.abi,
      contractAddress
    );

    this.userId = this.ethConnection.getCurrentAccount();
  }

  /**
   * Calls a method of the holding contract and resolves only when confirmed
   */
  public send(funcName: string, pars: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // let gasEstimated = await this.uprtclInstance.methods[funcName](...pars).estimateGas()

      let sendPars = {
        from: this.ethConnection.getCurrentAccount(),
        gas: 750000
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
      from: this.ethConnection.getCurrentAccount()
    });
  }
}
