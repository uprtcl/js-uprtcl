import lodash from 'lodash';
import EventEmitter from 'events';

import {
  ConnectionEvents,
  PolkadotConnection,
  TransactionReceipt,
} from '../../connection.polkadot';
import { EveesCouncilDB } from './dexie.council.store';

import {
  CouncilData,
  CouncilProposal,
  LocalHeadUpdate,
  LocalProposal,
  ProposalManifest,
  ProposalSummary,
  Vote,
} from './types';
import { getStatus } from './proposal.logic.quorum';
import { ProposalConfig, ProposalStatus, VoteValue } from './proposal.config.types';
import {
  Entity,
  EntityStore,
  EntityResolver,
  Logger,
  Perspective,
  PerspectiveDetails,
  Signed,
  Update,
} from '@uprtcl/evees';

export const COUNCIL_KEYS = ['evees-council-cid1', 'evees-council-cid0'];

export enum CouncilStoreEvents {
  proposalStatusChanged = 'proposal-status-changed',
  perspectivesUpdated = 'perspectives-updated',
}

const LOG_ENABLED = false;

/* a store that keeps track of the council common state regarding the council proposals */
export class PolkadotCouncilEveesStorage {
  logger: Logger = new Logger('PolkadotCouncilEveesStorage');

  protected db!: EveesCouncilDB;
  readonly events?: EventEmitter;
  protected casID: string;

  private fetchPromises: Map<number, Promise<void>> = new Map();

  constructor(
    protected connection: PolkadotConnection,
    protected entityStore: EntityStore,
    public config: ProposalConfig,
    casID?: string,
    readonly fetchRealTime: boolean = true
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);

    this.casID = casID || this.entityStore.remotes[0].id;

    if (this.connection.events) {
      this.connection.events.on(ConnectionEvents.newBlock, (block) => {
        if (LOG_ENABLED) this.logger.log('Block received', block);
        if (this.fetchRealTime) {
          this.fetchCouncilDatas(block.number.toNumber());
        }
      });
    }
  }

  async ready(): Promise<void> {
    const localStoreName = `${this.connection.getNetworkId()}-evees-council`;
    if (!localStoreName) {
      throw new Error('networkId undefined');
    }
    this.db = new EveesCouncilDB(localStoreName);
    await this.fetchCouncilDatas();
  }

  /* council at is a constant function, can be cached */
  async getCouncil(at: number) {
    return this.connection.getCouncil(at);
  }

  async updateCouncilData(hash: string): Promise<TransactionReceipt> {
    const newHash = await this.gossipProposals(hash);
    return this.connection.updateMutableHead(newHash, COUNCIL_KEYS);
  }

  async gossipProposals(head?: string): Promise<string> {
    await this.ready();

    if (!this.connection.account) throw new Error('cant update data if not logged in');

    // gossip consist on adding all new proposals from other council members to my own councilData object.
    head = head || (await this.connection.getMutableHead(this.connection.account, COUNCIL_KEYS));
    let myCouncilData: CouncilData = {};
    if (head) {
      try {
        const data = await this.entityStore.getEntity<CouncilData>(head);
        myCouncilData = data.object;
      } catch (e) {
        // its ok
      }
    }

    const councilProposals = myCouncilData.proposals ? myCouncilData.proposals : [];
    if (LOG_ENABLED) this.logger.log('gossip proposals');

    this.db.proposals.each((localProposal, cursor) => {
      if (councilProposals.findIndex((p) => p.id === cursor.key) === -1) {
        const proposal = {
          id: cursor.key,
        };
        if (LOG_ENABLED) this.logger.log('gossiping', proposal);
        councilProposals.push(proposal);
      }
    });

    myCouncilData.proposals = [...councilProposals];
    if (LOG_ENABLED) this.logger.log('CouncilData Updated to', myCouncilData);

    const data = await this.entityStore.hashObject({
      object: myCouncilData,
      remote: this.casID,
    });

    return data.hash;
  }

  async getCouncilDataOf(member: string, block?: number): Promise<CouncilData> {
    block = block || (await this.db.meta.get('block')).value;
    const head = await this.connection.getMutableHead(member, COUNCIL_KEYS, block);
    if (!head) {
      if (LOG_ENABLED) this.logger.log(`Council Data of ${member} is undefined`);
      return {};
    }

    let councilData: Entity<CouncilData> | undefined = undefined;

    try {
      councilData = await this.entityStore.getEntity(head);
    } catch (e) {
      this.logger.error(`Error getting head entity from store ${head}`);
    }

    if (LOG_ENABLED) this.logger.log(`Council Data of ${member}`, councilData);
    return councilData ? councilData.object : {};
  }

  /** check the proposal had enough votes at block */
  async getProposalStatus(proposalId: string, at?: number): Promise<ProposalStatus> {
    at = at || (await this.db.meta.get('block')).value;

    const manifest = await this.getProposalManifest(proposalId);

    if (manifest.config.duration !== this.config.duration) {
      throw new Error(`unexpected duration ${manifest.config.duration}`);
    }
    if (manifest.config.quorum !== this.config.quorum) {
      throw new Error(`unexpected quorum ${manifest.config.quorum}`);
    }
    if (manifest.config.thresehold !== this.config.thresehold) {
      throw new Error(`unexpected thresehold ${manifest.config.thresehold}`);
    }

    const votesCastedLocal = await this.db.votes.where('proposalId').equals(proposalId).toArray();

    const votesCasted = votesCastedLocal.map(
      (vote): Vote => {
        return {
          proposalId: vote.proposalId,
          member: vote.member,
          value: vote.value,
        };
      }
    );

    /** fill empty votes for non voters */
    const council = await this.getCouncil(manifest.block);

    const nonVoter = council.filter(
      (member) => votesCasted.findIndex((casted) => casted.member === member) === -1
    );

    const emptyVotes = nonVoter.map(
      (member): Vote => {
        return {
          member,
          proposalId,
          value: VoteValue.Undefined,
        };
      }
    );

    return getStatus(votesCasted.concat(emptyVotes), at as number, manifest);
  }

  /** reads all the council datas and populate the DB */
  async fetchCouncilDatas(at?: number) {
    at = at || (await this.connection.getLatestBlock());
    const last = await this.db.meta.get('block');

    /** only update if block is new */
    if (!last || at > last.value) {
      /** prevent making parallel requests */
      if (this.fetchPromises.has(at)) {
        return this.fetchPromises.get(at);
      }

      const fetchAt = async (at) => {
        const council = await this.connection.getCouncil(at);

        if (LOG_ENABLED) this.logger.log('Fetch council data', { at, council });

        await Promise.all(
          council.map(async (member) => {
            if (at === undefined) throw new Error('latest block was not defined');

            // get council data of member.
            const data = await this.getCouncilDataOf(member, at);

            await Promise.all(this.cacheVotes(data, at, member));
            /** proposal status uses the latest cached votes */
            await Promise.all(this.cacheProposals(data, at));
          })
        );

        /** timestamp the latest sync */
        this.db.meta.put({ entry: 'block', value: at });
      };

      const fetchPromise = fetchAt(at);
      this.fetchPromises.set(at, fetchPromise);

      await fetchPromise;

      this.fetchPromises.delete(at);
    }
  }

  cacheProposals(data: CouncilData, at: number): Promise<void>[] {
    if (data.proposals === undefined) return [];

    if (LOG_ENABLED) this.logger.log('caching proposals of ', { data });

    return data.proposals.map(async (councilProposal) => this.cacheProposal(councilProposal, at));
  }

  async cacheProposal(councilProposal: CouncilProposal, at): Promise<void> {
    const proposalId = councilProposal.id;
    // store proposals of that member on my local db.
    const mine = await this.db.proposals.get(proposalId);

    if (LOG_ENABLED) this.logger.log(`caching proposal ${proposalId}`, { mine });

    // if I have it and is not pending, that's it.
    if (mine && mine.status !== ProposalStatus.Pending) return;

    const proposal = mine || (await this.initLocalProposal(proposalId));

    const prevStatus = proposal.status;
    proposal.status = await this.getProposalStatus(proposalId, at);

    if (proposal.status !== prevStatus) {
      if (LOG_ENABLED) this.logger.log('proposal status changed', proposal);
      this.events
        ? this.events.emit(CouncilStoreEvents.proposalStatusChanged, {
            proposalId: proposal.id,
            status: proposal.status,
          })
        : null;
    }

    if (LOG_ENABLED) this.logger.log(`adding proposal to cache ${proposalId}`, { proposal });
    await this.db.proposals.put(proposal);

    /** accepted proposals are converted into valid perspectives */
    if (proposal.status === ProposalStatus.Accepted) {
      const newPerspectivesUpdates = proposal.mutation.newPerspectives
        ? proposal.mutation.newPerspectives.map((np) => np.update)
        : [];
      const updates = proposal.mutation.updates ? proposal.mutation.updates : [];
      const allUpdates = newPerspectivesUpdates.concat(updates);

      await Promise.all(
        allUpdates.map(async (update: Update) => {
          const perspective = await this.entityStore.getEntity<Signed<Perspective>>(
            update.perspectiveId
          );
          const localPerspective = await this.db.perspectives.get(update.perspectiveId);
          const currentUpdates: LocalHeadUpdate[] = localPerspective
            ? localPerspective.headUpdates
            : [];

          currentUpdates.push({
            block: proposal.endBlock,
            headId: update.details.headId,
          });

          /** keep updates ordered from newer to older, and headId alphabetically on same block case */
          const newUpdates = lodash.sortBy(currentUpdates, ['block', 'headId']).reverse();

          await this.db.perspectives.put({
            id: update.perspectiveId,
            context: perspective.object.payload.context,
            headUpdates: newUpdates,
          });
        })
      );

      this.events
        ? this.events.emit(
            CouncilStoreEvents.perspectivesUpdated,
            allUpdates.map((u) => u.perspectiveId)
          )
        : null;
    }
  }

  cacheVotes(data: CouncilData, at: number, member: string): Promise<void>[] {
    if (data.votes === undefined) return [];

    if (LOG_ENABLED) this.logger.log('caching votes of', { data });

    return data.votes.map(async (vote) => {
      const voteId = `${vote.proposalId}-${vote.member}`;
      const myCopy = await this.db.votes.get(voteId);

      if (LOG_ENABLED) this.logger.log('caching vote of', { vote, myCopy });

      /* if I have it that's it. This also prevents double casting votes */
      if (myCopy) return;

      // otherwise, validate and store it in our db of votes
      const proposalManifest = await this.getProposalManifest(vote.proposalId);

      /** check the voter is part of the council */
      const council = await this.getCouncil(proposalManifest.block);

      if (!council.includes(vote.member)) {
        this.logger.error(
          `Corrupt vote for proposal ${vote.proposalId} comming from council data of member ${member}`
        );
        return;
      }

      if (LOG_ENABLED) this.logger.log('adding vote to cache', { vote });
      const voteLocal = {
        id: voteId,
        proposalId: vote.proposalId,
        member: vote.member,
        value: vote.value,
      };
      this.db.votes.put(voteLocal);
    });
  }

  async getProposalManifest(proposalId: string): Promise<ProposalManifest> {
    const proposalPerspective = await this.entityStore.getEntity<Signed<Perspective>>(proposalId);
    if (!proposalPerspective) throw new Error(`Proposal ${proposalId} not found`);
    return proposalPerspective.object.payload.meta.proposal;
  }

  async initLocalProposal(proposalId: string): Promise<LocalProposal> {
    const proposalManifest = await this.getProposalManifest(proposalId);
    return {
      id: proposalId,
      toPerspectiveId: proposalManifest.toPerspectiveId,
      mutation: proposalManifest.mutation,
      status: ProposalStatus.Pending,
      endBlock: proposalManifest.block + proposalManifest.config.duration,
    };
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    await this.ready();
    /** at this point cache data is up to date */
    if (LOG_ENABLED) this.logger.log(`getting perspective ${perspectiveId}`);
    const perspective = await this.db.perspectives.get(perspectiveId);

    const headId =
      perspective && perspective.headUpdates.length > 0
        ? perspective.headUpdates[0].headId
        : undefined;

    return { headId };
  }

  async getContextPerspectives(context: string) {
    await this.ready();
    const perspectiveIds = await this.db.perspectives
      .where('context')
      .equals(context)
      .primaryKeys();

    if (LOG_ENABLED) this.logger.log(`getting context perspectives ${context}`, perspectiveIds);

    return perspectiveIds;
  }

  async addProposalToCouncilData(councilProposal: CouncilProposal, at?: number) {
    at = at || (await this.db.meta.get('block')).value;
    if (this.connection.account === undefined) throw new Error('user not logged in');
    const myCouncilData = await this.getCouncilDataOf(this.connection.account);

    let newCouncilData = { ...myCouncilData };
    if (newCouncilData.proposals === undefined) {
      newCouncilData.proposals = [];
    }

    const ix = newCouncilData.proposals.findIndex((p) => p.id === councilProposal.id);
    if (ix === -1) {
      newCouncilData.proposals.push(councilProposal);
    } else {
      newCouncilData.proposals.splice(ix, 1, councilProposal);
    }

    if (LOG_ENABLED)
      this.logger.log('addProposalToCouncilData', {
        myCouncilData,
        newCouncilData,
      });

    return newCouncilData;
  }

  async addVoteToCouncilData(vote: Vote, at?: number) {
    if (this.connection.account === undefined) throw new Error('user not logged in');
    const myCouncilData = await this.getCouncilDataOf(this.connection.account, at);

    let newCouncilData = { ...myCouncilData };
    if (newCouncilData.votes === undefined) {
      newCouncilData.votes = [];
    }

    const ix = newCouncilData.votes.findIndex(
      (v) => v.proposalId === vote.proposalId && v.member === vote.member
    );
    newCouncilData.votes.push(vote);

    if (LOG_ENABLED)
      this.logger.log('addProposalToCouncilData', {
        myCouncilData,
        newCouncilData,
      });

    return newCouncilData;
  }

  async createProposal(proposalManifest: ProposalManifest): Promise<string> {
    if (this.connection.account === undefined) throw new Error('user not logged in');
    if (!(await this.connection.canSign())) throw new Error('user cant sign');

    /** a proposal is a perspective like object (includes the remote) but we make it inmutable by adding the
     * proposal details (mutation or list of changes) part of the perspective object. */
    const proposalObject: Signed<Perspective> = {
      payload: {
        remote: proposalManifest.remote,
        context: '',
        creatorId: '',
        path: '',
        timestamp: Date.now(),
        meta: {
          proposal: proposalManifest,
        },
      },
      proof: {
        signature: '',
        type: '',
      },
    };

    const proposal = await this.entityStore.hashObject(
      {
        object: proposalObject,
        remote: this.casID,
      },
      true
    );
    const council = await this.connection.getCouncil(proposalManifest.block);
    if (!council.includes(this.connection.account)) throw new Error('user not a council member');

    const councilProposal: CouncilProposal = {
      id: proposal.hash,
    };

    const newCouncilData = await this.addProposalToCouncilData(councilProposal);
    const newCouncilDataEntity = await this.entityStore.hashObject(
      {
        object: newCouncilData,
        remote: this.casID,
      },
      true
    );
    if (LOG_ENABLED) this.logger.log('createProposal', { newCouncilDataEntity });
    await Promise.all([
      this.entityStore.flush(),
      this.updateCouncilData(newCouncilDataEntity.hash),
    ]);

    /** cache this proposal on my localdb */
    const localProposal = await this.initLocalProposal(proposal.hash);

    if (LOG_ENABLED) this.logger.log('caching proposal', { proposal, localProposal });
    await this.db.proposals.put(localProposal);

    return proposal.hash;
  }

  async getProposalsToPerspective(perspectiveId: string) {
    const proposals = this.db.proposals.where('toPerspectiveId').equals(perspectiveId);
    const proposalIds = await proposals.primaryKeys();
    if (LOG_ENABLED)
      this.logger.log('getProposalsToPerspective', {
        perspectiveId,
        proposalIds,
      });
    return proposalIds;
  }

  async getProposalSummary(proposalId): Promise<ProposalSummary> {
    const proposal = await this.db.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (!proposal.status) throw new Error(`Proposal ${proposalId} status undefined`);

    const votes = await this.db.votes.where('proposalId').equals(proposalId).toArray();

    if (LOG_ENABLED) this.logger.log('getProposalStatus', { proposalId, proposal });
    const block = (await this.db.meta.get('block')).value;
    return {
      status: proposal.status,
      votes,
      block,
    };
  }

  async vote(proposalId: string, value: VoteValue) {
    if (!this.connection.account) throw new Error('cant vote if not logged in');

    const proposal = await this.db.proposals.get(proposalId);
    if (!proposal) throw new Error(`proposal not found ${proposalId}`);

    if (proposal.status !== ProposalStatus.Pending)
      throw new Error(`why are you trying to vote on a closed proposal ${proposalId}?`);

    const vote: Vote = {
      member: this.connection.account,
      proposalId,
      value,
    };
    const newCouncilData = await this.addVoteToCouncilData(vote);
    const newCouncilDataEntity = await this.entityStore.hashObject(
      {
        object: newCouncilData,
        remote: this.casID,
      },
      true
    );

    if (LOG_ENABLED) this.logger.log('vote', { vote, newCouncilDataEntity, newCouncilData });
    await Promise.all([
      this.entityStore.flush(),
      this.updateCouncilData(newCouncilDataEntity.hash),
    ]);

    /** update the proposal status based  */
    await this.fetchCouncilDatas();
  }
}
