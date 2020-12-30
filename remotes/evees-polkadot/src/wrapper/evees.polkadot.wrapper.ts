import { IpfsStore, PinnerCached } from '@uprtcl/ipfs-provider';
import { CidConfig } from '@uprtcl/multiplatform';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

import {
  ProposalsOrbitDB,
  ProposalStore,
  ProposalsToPerspectiveStore,
  ContextStore,
  getProposalsAcl,
  getContextAcl,
} from '@uprtcl/evees-orbitdb';
import { EveesBlockchainCached } from '@uprtcl/evees-blockchain';
import { EveesRemote } from '@uprtcl/evees';

import { PolkadotConnection } from '../connection.polkadot';
import { PolkadotOrbitDBIdentity } from '../orbitdb/polkadot.orbitdb.identity';
import { EveesPolkadotConnection } from '../provider/identity-based/evees.polkadot-connection';
import { EveesPolkadotCouncil } from '../provider/council/evees.polkadot-council';

import { getConnectionDetails } from './connections';

export interface PinnerConfig {
  peerMultiaddr: string;
  url: string;
}

export class EveesPolkadotWrapper {
  remotes!: EveesRemote[];
  ipfsStore!: IpfsStore;
  orbitDBCustom!: OrbitDBCustom;
  pdkEveesConnection!: EveesPolkadotConnection;

  constructor(
    protected ipfs: any,
    protected pinnerConfig: PinnerConfig,
    protected ipfsCidConfig: CidConfig = {
      version: 1,
      type: 'sha2-256',
      codec: 'raw',
      base: 'base58btc',
    }
  ) {}

  async load() {
    const connections = getConnectionDetails();
    const pkdConnection = new PolkadotConnection(connections.connections, connections.current);
    await pkdConnection.ready();

    console.log(`${this.pinnerConfig.peerMultiaddr} connecting...`);
    await this.ipfs.swarm.connect(this.pinnerConfig.peerMultiaddr);
    console.log(`${this.pinnerConfig.peerMultiaddr} connected!`);

    const pinner = new PinnerCached(this.pinnerConfig.url, 3000);

    this.ipfsStore = new IpfsStore(this.ipfsCidConfig, this.ipfs, pinner);
    await this.ipfsStore.ready();

    const identity = new PolkadotOrbitDBIdentity(pkdConnection);

    this.orbitDBCustom = new OrbitDBCustom(
      [ContextStore, ProposalStore, ProposalsToPerspectiveStore],
      [getContextAcl([identity]), getProposalsAcl([identity])],
      identity,
      pinner,
      this.pinnerConfig.peerMultiaddr,
      this.ipfs
    );
    await this.orbitDBCustom.ready();

    const proposals = new ProposalsOrbitDB(this.orbitDBCustom, this.ipfsStore);

    this.pdkEveesConnection = new EveesPolkadotConnection(pkdConnection);
    await this.pdkEveesConnection.ready();

    const pkdEvees = new EveesBlockchainCached(
      this.pdkEveesConnection,
      this.orbitDBCustom,
      this.ipfsStore,
      proposals
    );

    const councilConfig = {
      // duration: Math.round((5.0 * 60.0 * 60.0 * 24.0) / 5.0),
      duration: Math.round((10.0 * 60.0) / 5.0),
      quorum: 1.0 / 3.0,
      thresehold: 0.5,
    };
    const pkdCouncilEvees = new EveesPolkadotCouncil(pkdConnection, this.ipfsStore, councilConfig);
    await pkdEvees.connect();

    this.remotes = [pkdEvees, pkdCouncilEvees];
  }
}
