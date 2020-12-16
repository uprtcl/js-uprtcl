import { html, TemplateResult } from 'lit-html';

import { Logger } from '@uprtcl/micro-orchestrator';
import {
  EthereumConnection,
  EthereumContractOptions,
  EthereumContract,
} from '@uprtcl/ethereum-provider';
import { BlockchainConnection } from '@uprtcl/evees-blockchain';
import { cidToHex32, bytes32ToCid } from '@uprtcl/ipfs-provider';

import {
  abi as abiRoot,
  networks as networksRoot,
} from './contracts-json/UprtclRoot.min.json';
const UprtclRoot = { abi: abiRoot, networks: networksRoot };
const ZERO_ADDRESS = '0x' + new Array(40).fill(0).join('');
const ZERO_HEX_32 = '0x' + new Array(64).fill(0).join('');

import { UPDATED_HEAD } from './common';
import { icons } from './icons';

export class EveesEthereumConnection implements BlockchainConnection {
  logger: Logger = new Logger('EveesEthereum');

  public uprtclRoot: EthereumContract;

  constructor(
    public connection: EthereumConnection,
    uprtclRootOptions: EthereumContractOptions = {
      contract: UprtclRoot as any,
    }
  ) {
    this.uprtclRoot = new EthereumContract(uprtclRootOptions, connection);
  }

  async ready() {
    await Promise.all([this.connection.ready(), this.uprtclRoot.ready()]);
  }

  async getHead(userId: string, block?: number) {
    if (!userId) return undefined;

    const filter = this.uprtclRoot.contractInstance.filters.HeadUpdated(
      userId,
      null,
      null
    );
    const events = await this.uprtclRoot.contractInstance.queryFilter(
      filter,
      0,
      block
    );

    if (events.length === 0) return undefined;
    const last = events
      .sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1))
      .pop();
    if (!last) return undefined;
    if (!last.args) return undefined;

    return bytes32ToCid([last.args.val1, last.args.val0]);
  }

  async updateHead(head: string | undefined) {
    const headCidParts =
      head !== undefined ? cidToHex32(head) : [ZERO_HEX_32, ZERO_HEX_32];

    return this.uprtclRoot.send(UPDATED_HEAD, [
      headCidParts[0],
      headCidParts[1],
      ZERO_ADDRESS,
    ]);
  }

  get account() {
    return this.connection.account.toLocaleLowerCase();
  }
  getNetworkId() {
    return `eth-${this.connection.getNetworkId()}`;
  }
  icon(): TemplateResult {
    let chainName = 'unkown';
    switch (this.connection.getNetworkId()) {
      case '1':
        chainName = 'mainnet';
      case '4':
        chainName = 'rinkeby';
      case '100':
        chainName = 'xDAI';
    }
    return html`
      <div
        style="display:flex;align-items: center;color: #636668;font-weight:bold"
      >
        <div style="height: 28px;width: 28px;margin-right: 6px">
          ${icons.ethereum}
        </div>
        ${chainName}
      </div>
    `;
  }
  avatar(userId: string, config: any = { showName: true }) {
    return html`<threebox-profile
      address=${userId}
      ?show-name=${config.showName}
    >
    </threebox-profile> `;
  }
  async getLatestBlock() {
    return this.connection.getLatestBlock();
  }
  async canSign() {
    return this.connection.canSign();
  }
  async connectWallet() {
    return this.connection.connectWallet();
  }
  async disconnectWallet() {
    return this.connection.disconnectWallet();
  }
}
