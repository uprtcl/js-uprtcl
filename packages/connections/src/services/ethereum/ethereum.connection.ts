import { Connection, ConnectionOptions } from '../../connections/connection';
import Web3 from 'web3';
import { provider } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

export interface EthereumConnectionOptions {
  provider: provider;
  contractAbi: AbiItem[] | AbiItem;
  contractAddress?: string;
}

export class EthereumConnection extends Connection {
  web3!: Web3;
  contractInstance!: Contract;
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

    this.accounts = await this.web3.eth.getAccounts();
    this.networkId = await this.web3.eth.net.getId();

    const contractAddress = this.ethOptions.contractAddress;

    this.contractInstance = new this.web3.eth.Contract(
      this.ethOptions.contractAbi,
      contractAddress
    );
  }

  /**
   * Calls a method of the holding contract and resolves only when confirmed
   */
  public send(funcName: string, pars: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // let gasEstimated = await this.uprtclInstance.methods[funcName](...pars).estimateGas()

      let sendPars = {
        from: this.getDefaultAccount(),
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
          this.logger.log(`CONFIRMED ${funcName}`, { confirmationNumber, pars });
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
      from: this.getDefaultAccount()
    });
  }

  /**
   * @returns the default account for this ethereum connection
   */
  public getDefaultAccount(): string {
    return this.accounts[0];
  }
}
