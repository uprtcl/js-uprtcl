import { EveesRemote } from '@uprtcl/evees';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { CidConfig } from '@uprtcl/multiplatform';
import { OrbitDBCustom, AddressMapping } from '@uprtcl/orbitdb-provider';
import {
  ProposalsOrbitDB,
  PerspectiveStore,
  ProposalStore,
  ProposalsToPerspectiveStore,
  ContextStore,
  getProposalsAcl,
  getContextAcl,
  EveesOrbitDB,
} from '@uprtcl/evees-orbitdb';
import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { EthereumOrbitDBIdentity } from '../orbitdb/ethereum.orbtidb.identity';
import { EveesBlockchainCached } from '@uprtcl/evees-blockchain';
import { EveesEthereumConnection } from 'src/provider/evees.ethereum.connection';

export interface PinnerConfig {
  peerMultiaddr: string;
  url: string;
}

export class EveesEthereumWrapper {
  remotes!: EveesRemote[];
  ipfsStore!: IpfsStore;
  orbitDBCustom!: OrbitDBCustom;

  constructor(
    protected ipfs: any,
    protected provider: string,
    protected pinnerConfig: PinnerConfig,
    protected ipfsCidConfig: CidConfig = {
      version: 1,
      type: 'sha2-256',
      codec: 'raw',
      base: 'base58btc',
    }
  ) {}

  async load() {
    console.log(`${this.pinnerConfig.peerMultiaddr} connecting...`);
    await this.ipfs.swarm.connect(this.pinnerConfig.peerMultiaddr);
    console.log(`${this.pinnerConfig.peerMultiaddr} connected!`);

    this.ipfsStore = new IpfsStore(
      this.ipfsCidConfig,
      this.ipfs,
      this.pinnerConfig.url
    );
    await this.ipfsStore.ready();

    const ethConnection = new EthereumConnection({
      provider: this.provider,
    });
    await ethConnection.ready();
    const identity = new EthereumOrbitDBIdentity(ethConnection);

    const identitySources = [identity];
    const contextAcl = getContextAcl(identitySources);
    const proposalsAcl = getProposalsAcl(identitySources);
    const customStores = [
      PerspectiveStore,
      ContextStore,
      ProposalStore,
      ProposalsToPerspectiveStore,
      AddressMapping,
    ];

    this.orbitDBCustom = new OrbitDBCustom(
      customStores,
      [contextAcl, proposalsAcl],
      identity,
      this.pinnerConfig.url,
      this.pinnerConfig.peerMultiaddr,
      this.ipfs
    );
    await this.orbitDBCustom.ready();

    const orbitdbEvees = new EveesOrbitDB(this.orbitDBCustom, this.ipfsStore);
    await orbitdbEvees.connect();

    const proposals = new ProposalsOrbitDB(this.orbitDBCustom, this.ipfsStore);

    const ethEveesConnection = new EveesEthereumConnection(ethConnection);
    await ethEveesConnection.ready();

    const ethEvees = new EveesBlockchainCached(
      ethEveesConnection,
      this.orbitDBCustom,
      this.ipfsStore,
      proposals
    );
    await ethEvees.ready();

    this.remotes = [orbitdbEvees, ethEvees];
  }
}
