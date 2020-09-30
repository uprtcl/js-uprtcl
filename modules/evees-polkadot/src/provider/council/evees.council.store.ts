import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PerspectiveDetails } from '@uprtcl/evees';

import { PolkadotConnection, TransactionReceipt } from '../connection.polkadot';
import { EveesCouncilDB } from './dexie.council.store';

import { CouncilData, CouncilProposal, LocalProposal, ProposalManifest, Vote } from './types';
import { ProposalLogicQuorum } from './proposal.logic.quorum';
import { ProposalConfig, ProposalLogic, ProposalStatus } from './proposal.config.types';

export const COUNCIL_KEYS = ['evees-council-cid1', 'evees-council-cid0'];
export const EXPECTED_CONFIG: ProposalConfig = {
  duration: (1.0 * 86400.0) / 5.0,
  quorum: 1.0 / 3.0,
  thresehold: 0.5
};

/* a store that keeps track of the council common state regarding the council proposals */
export class PolkadotCouncilEveesStorage {
  logger: Logger = new Logger('PolkadotCouncilEveesStorage');
  protected db: EveesCouncilDB;
  private initialized: boolean = false;

  constructor(
    protected connection: PolkadotConnection,
    public store: CASStore,
    public config: ProposalConfig
  ) {
    this.db = new EveesCouncilDB();
  }

  async init() {
    await this.fetchCouncilDatas();
  }

  async ready(): Promise<void> {
    if (!this.initialized) {
      return this.init();
    }
  }

  /* council at is a constant function, can be cached */
  async getCouncil(at: number) {
    return this.connection.getCouncil(at);
  }

  async updateCouncilData(hash: string): Promise<TransactionReceipt> {
    const newHash = await this.gossipProposals();
    return this.connection.updateHead(newHash, COUNCIL_KEYS);
  }

  async gossipProposals() {
    if (!this.connection.account) throw new Error('cant update data if not logged in');
    // gossip consist on adding all new proposals to my own councilData object.
    const head = await this.connection.getHead(this.connection.account, COUNCIL_KEYS);
    const myCouncilData = head ? ((await this.store.get(head)) as CouncilData) : {};

    const councilProposals = myCouncilData.proposals ? myCouncilData.proposals : [];
    this.db.proposals.each((localProposal, cursor) => {
      if (councilProposals.findIndex(p => p.id === cursor.key) === -1) {
        councilProposals.push({
          id: cursor.key,
          blockEnd: localProposal.blockEnd
        });
      }
    });

    myCouncilData.proposals = [...councilProposals];
    return this.store.create(myCouncilData);
  }

  async getCouncilDataOf(member: string, block?: number): Promise<CouncilData> {
    block = block || (await this.db.meta.get('block'));
    const head = await this.connection.getHead(member, COUNCIL_KEYS, block);
    if (head === undefined) return {};
    const councilData = await this.store.get(head);
    return councilData ? councilData : {};
  }

  /** check the proposal had enough votes at block */
  async getProposalLogic(proposalId: string, atBlock: number): Promise<ProposalLogic> {
    const manifest = await this.getProposalManifest(proposalId);

    if (manifest.config.duration !== EXPECTED_CONFIG.duration) {
      throw new Error(`unexpected duration ${manifest.config.duration}`);
    }
    if (manifest.config.quorum !== EXPECTED_CONFIG.quorum) {
      throw new Error(`unexpected quorum ${manifest.config.quorum}`);
    }
    if (manifest.config.thresehold !== EXPECTED_CONFIG.thresehold) {
      throw new Error(`unexpected thresehold ${manifest.config.thresehold}`);
    }

    const votes = await this.db.votes
      .where('proposalId')
      .equals(proposalId)
      .toArray();

    return new ProposalLogicQuorum(
      manifest,
      votes.map(memberVote => memberVote.value),
      atBlock
    );
  }

  /** reads all the council datas and populate the DB */
  async fetchCouncilDatas(at?: number) {
    at = at || (await this.connection.getLatestBlock());
    const council = await this.connection.getCouncil(at);

    await Promise.all(
      council.map(async member => {
        // get council data of member.
        const data = await this.getCouncilDataOf(member, at);

        const fetchProposals = this.fetchProposals(data, member);
        const fetchVotes = this.fetchVotes(data, member);

        // after this promise, my local DB will be synched with data the rest of council members
        return Promise.all([...fetchProposals, ...fetchVotes]);
      })
    );

    /** timestamp the latest sync */
    this.db.meta.put({
      entry: 'block',
      value: at
    });
  }

  fetchProposals(data: CouncilData, member: string): Promise<void>[] {
    if (data.proposals === undefined) return [];

    return data.proposals.map(async councilProposal => {
      const proposalId = councilProposal.id;
      // store proposals of that member on my local db.
      const mine = await this.db.proposals.get(proposalId);

      // if I have it and is verified, that's it.
      if (mine && mine.blockEnd) return;

      // if the proposal is new to me
      if (councilProposal.blockEnd !== undefined) {
        const logic = await this.getProposalLogic(proposalId, councilProposal.blockEnd);
        // if approved, verify it and if valid, store it in local storage.
        if (logic.isApproved()) {
          const proposal = mine || (await this.initLocalProposal(proposalId));

          proposal.status = {
            status: logic.status(),
            votes: logic.getVotes()
          };
          this.db.proposals.put(proposal);
        } else {
          this.logger.error(
            `Corrupt state for proposal ${proposalId} comming from council member ${member}`
          );
          return;
        }
      } else {
        // if proposal not yet closed, see if it is closed.
        const logic = await this.getProposalLogic(
          proposalId,
          await this.connection.getLatestBlock()
        );
        if (logic.isPending()) {
          const proposal = mine || (await this.initLocalProposal(proposalId));
          this.db.proposals.put(proposal);
        } else {
          this.logger.error(
            `Corrupt state for proposal ${proposalId} comming from council member ${member}`
          );
          return;
        }
      }
    });
  }

  fetchVotes(data: CouncilData, member: string): Promise<void>[] {
    if (data.votes === undefined) return [];

    return data.votes.map(async vote => {
      const myCopy = this.db.votes
        .where('proposalId')
        .equals(vote.proposalId)
        .and(v => v.member === vote.member);

      // if I have it that's it.
      if (myCopy) return Promise.resolve();

      // otherwise, validate and store it in our db of votes
      const proposalManifest = await this.getProposalManifest(vote.proposalId);
      const council = await this.getCouncil(proposalManifest.block);

      if (!council.includes(vote.member)) {
        this.logger.error(
          `Corrupt vote for proposal ${vote.proposalId} comming from council member ${member}`
        );
        return;
      }

      this.db.votes.put(vote);
    });
  }

  async getProposalManifest(proposalId: string): Promise<ProposalManifest> {
    const proposalManifest = (await this.store.get(proposalId)) as ProposalManifest;
    if (!proposalManifest) throw new Error(`Proposal ${proposalId} not found`);
    return proposalManifest;
  }

  async initLocalProposal(proposalId: string): Promise<LocalProposal> {
    const proposalManifest = await this.getProposalManifest(proposalId);
    return {
      id: proposalId,
      toPerspectiveId: proposalManifest.toPerspectiveId,
      updatedPerspectives: proposalManifest.updates.map(update => update.perspectiveId),
      updates: proposalManifest.updates,
      status: {
        status: ProposalStatus.Pending,
        votes: []
      }
    };
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    await this.ready();
    /** assume cache data is uptodate */
    const proposals = this.db.proposals
      .where('updatedPerspectives')
      .equals(perspectiveId)
      .and(proposal => proposal.blockEnd !== undefined);

    const proposalsSorted = await proposals.sortBy('blockEnd');
    if (proposalsSorted.length === 0) return {};

    const update = proposalsSorted[0].updates.find(u => u.perspectiveId === perspectiveId);
    return update ? { headId: update.newHeadId } : {};
  }

  async addProposalToCouncilData(councilProposal: CouncilProposal, at?: number) {
    at = at || (await this.db.meta.get('block'));
    if (this.connection.account === undefined) throw new Error('user not logged in');
    const myCouncilData = await this.getCouncilDataOf(this.connection.account);

    let newCouncilData = { ...myCouncilData };
    if (newCouncilData.proposals === undefined) {
      newCouncilData.proposals = [];
    }

    const ix = newCouncilData.proposals.findIndex(p => p.id === councilProposal.id);
    if (ix === -1) {
      newCouncilData.proposals.push(councilProposal);
    } else {
      newCouncilData.proposals.splice(ix, 1, councilProposal);
    }
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
      v => v.proposalId === vote.proposalId && v.member === vote.member
    );
    newCouncilData.votes.push(vote);
    return newCouncilData;
  }

  async createProposal(proposalManifest: ProposalManifest): Promise<string> {
    if (this.connection.account === undefined) throw new Error('user not logged in');
    if (!(await this.connection.canSign())) throw new Error('user cant sign');

    const proposalId = await this.store.create(proposalManifest);
    const council = await this.connection.getCouncil();
    if (!council.includes(this.connection.account)) throw new Error('user not a council member');

    const councilProposal: CouncilProposal = {
      id: proposalId
    };

    const newCouncilData = await this.addProposalToCouncilData(councilProposal);
    const newCouncilDataHash = await this.store.create(newCouncilData);
    await this.updateCouncilData(newCouncilDataHash);

    /** cache this proposal on my localdb */
    const localProposal = await this.initLocalProposal(proposalId);
    await this.db.proposals.put(localProposal);

    return proposalId;
  }

  async getProposalsToPerspective(perspectiveId: string) {
    const proposals = this.db.proposals.where('toPerspectiveId').equals(perspectiveId);
    return await proposals.primaryKeys();
  }

  async getProposalStatus(proposalId): Promise<LocalProposal> {
    const proposal = await this.db.proposals.get(proposalId);
    if (!proposal) throw new Error(`proposal ${proposalId} not on memory`);
    return proposal;
  }

  async vote(proposalId: string, vote: any) {
    const proposal = await this.db.proposals.get(proposalId);
    if (!proposal) throw new Error(`proposal not found ${proposalId}`);

    if (proposal.blockEnd !== undefined)
      throw new Error(`why are you trying to vote on a closed proposal ${proposalId}?`);

    /** as far as I know, this proposal is pending, so cast my vote and mine it */
    /** add it to my CouncilData */
    const newCouncilData = await this.addVoteToCouncilData(vote);
    const newCouncilDataHash = await this.store.create(newCouncilData);
    const tx = await this.updateCouncilData(newCouncilDataHash);

    /** update local data to the block my vote was mined */
    await this.fetchCouncilDatas(tx.block);

    /** now verify the proposal status */
    const atAfter = await this.db.meta.get('block');
    const logic = await this.getProposalLogic(proposalId, atAfter);

    if (!logic.isPending()) {
      /** OMG my vote settled the proposal, store this on my council data too! */
      const newCouncilData = await this.addProposalToCouncilData({
        id: proposalId,
        blockEnd: atAfter
      });
      const newCouncilDataHash = await this.store.create(newCouncilData);
      await this.updateCouncilData(newCouncilDataHash);

      /** update my local data with my recent vote */
      await this.fetchCouncilDatas();
    }
  }
}
