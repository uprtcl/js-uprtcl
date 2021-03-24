import { IpfsStore, PinnerCached } from '@uprtcl/ipfs-provider';
import { EveesBlockchain } from '@uprtcl/evees-blockchain';
import { CidConfig, RemoteEvees } from '@uprtcl/evees';
import { EveesOrbitDBSearchEngine, PerspectiveStore, getContextAcl } from '@uprtcl/evees-orbitdb';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

import { PolkadotConnection } from '../connection.polkadot';
import { EveesPolkadotConnection } from '../provider/identity-based/evees.polkadot-connection';
import { EveesPolkadotCouncil } from '../provider/council/evees.polkadot-council';
import { PolkadotOrbitDBIdentity } from '../orbitdb.id/polkadot.orbitdb.identity';

import { getConnectionDetails } from './connections';

export class EveesPolkadotWrapper {
  public remotes!: RemoteEvees[];
  public ipfsStore!: IpfsStore;
  public pkdEveesConnection!: EveesPolkadotConnection;

  constructor(
    protected ipfs: any,
    protected pinner: PinnerCached,
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

    this.ipfsStore = new IpfsStore(this.ipfsCidConfig, this.ipfs, this.pinner);
    await this.ipfsStore.ready();

    this.pkdEveesConnection = new EveesPolkadotConnection(pkdConnection);
    await this.pkdEveesConnection.ready();

    const identity = new PolkadotOrbitDBIdentity(pkdConnection);

    const orbitDBCustom = new OrbitDBCustom(
      [PerspectiveStore],
      [getContextAcl([identity])],
      identity,
      this.pinner,
      this.ipfs
    );

    const searchEngine = new EveesOrbitDBSearchEngine(orbitDBCustom, this.ipfsStore);
    const pkdEvees = new EveesBlockchain(
      this.pkdEveesConnection,
      searchEngine,
      this.ipfsStore.casID
    );

    const councilConfig = {
      // duration: Math.round((5.0 * 60.0 * 60.0 * 24.0) / 5.0),
      duration: Math.round((10.0 * 60.0) / 5.0),
      quorum: 1.0 / 3.0,
      thresehold: 0.5,
    };
    const pkdCouncilEvees = new EveesPolkadotCouncil(
      pkdConnection,
      this.ipfsStore.casID,
      councilConfig
    );
    await pkdEvees.connect();

    this.remotes = [pkdEvees, pkdCouncilEvees];
  }
}
