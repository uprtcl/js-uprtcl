import { Connection, ConnectionOptions } from './connection';
import Web3 from 'web3';
import { provider } from 'web3-providers';
import { Eth } from 'web3-eth';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

export class EthereumConnection extends Connection {
  web3!: Web3;
  contractInstance!: Contract;

  constructor(
    protected provider: provider,
    protected contractAbi: AbiItem[] | AbiItem,
    protected contractAddress: string,
    options: ConnectionOptions
  ) {
    super(options);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    this.web3 = new Web3(this.provider);
    this.web3.transactionConfirmationBlocks = 1;
    this.contractInstance = new this.web3.eth.Contract(this.contractAbi, this.contractAddress);
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
  public call(funcName: string, pars: any[]): Promise<any> {
    return this.contractInstance.methods[funcName](...pars).call({
      from: this.getDefaultAccount()
    });
  }

  /**
   * @returns the default account for this ethereum connection
   */
  public async getDefaultAccount(): Promise<string> {
    const accounts = await this.web3.eth.getAccounts();
    return accounts[0];
  }
}
