import { Logger } from '@uprtcl/micro-orchestrator';
import { EthereumConnection, EthereumContractOptions, EthereumContract } from '@uprtcl/ethereum-provider';
import { BlockchainConnection } from '@uprtcl/evees-blockchain';
import { cidToHex32, bytes32ToCid } from '@uprtcl/ipfs-provider';


import { abi as abiRoot, networks as networksRoot } from './contracts-json/UprtclRoot.min.json';
const UprtclRoot = { abi: abiRoot, networks: networksRoot };
const ZERO_ADDRESS = '0x' + new Array(40).fill(0).join('');

import { UPDATED_HEAD } from './common';

export class EveesEthereumConnection extends EthereumConnection implements BlockchainConnection {
  logger: Logger = new Logger('EveesPolkadot');

  public uprtclRoot: EthereumContract;

  constructor(uprtclRootOptions: EthereumContractOptions = {
    contract: UprtclRoot as any
  }) {
    super();
    this.uprtclRoot = new EthereumContract(uprtclRootOptions, this);
  }

  async getHead(userId: string, block?: number) {
    const filter = this.uprtclRoot.contractInstance.filters.HeadUpdated(userId, null, null);
    const events = await this.uprtclRoot.contractInstance.queryFilter(filter, 0, block);

    if (events.length === 0) return undefined;
    const last = events.sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1)).pop();
    if (!last) return undefined;
    if (!last.args) return undefined;

    return bytes32ToCid([last.args.headCid1, last.args.headCid0]);
  }

  async updateHead(head: string) {
    const headCidParts = cidToHex32(head);

    return this.uprtclRoot.send(UPDATED_HEAD, [
      headCidParts[0],
      headCidParts[1],
      ZERO_ADDRESS
    ]);    
  }
 
}
