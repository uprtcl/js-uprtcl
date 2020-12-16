import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Perspective, PerspectiveDetails } from '@uprtcl/evees';

import {
  PolkadotConnection,
  TransactionReceipt,
} from '../../connection.polkadot';
import { EveesCouncilDB } from './dexie.council.store';

import {
  CouncilData,
  CouncilProposal,
  LocalProposal,
  ProposalManifest,
  ProposalSummary,
  Vote,
} from './types';
import { getStatus } from './proposal.logic.quorum';
import {
  ProposalConfig,
  ProposalStatus,
  VoteValue,
} from './proposal.config.types';
import { Signed } from '@uprtcl/cortex';

export const COUNCIL_KEYS = ['evees-council-cid1', 'evees-council-cid0'];

/* a store that keeps track of the council common state regarding the council proposals */
export class PolkadotCouncilEveesStorage {
  logger: Logger = new Logger('PolkadotCouncilEveesStorage');
  protected db!: EveesCouncilDB;

  constructor(
    protected connection: PolkadotConnection,
    public store: CASStore,
    public config: ProposalConfig
  ) {}

  async ready(): Promise<void> {
    await this.connection.ready();
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

  async gossipProposals(head?: string) {
    await this.ready();

    if (!this.connection.account)
      throw new Error('cant update data if not logged in');

    // gossip consist on adding all new proposals from other council members to my own councilData object.
    head =
      head ||
      (await this.connection.getMutableHead(
        this.connection.account,
        COUNCIL_KEYS
      ));
    const myCouncilData = head
      ? ((await this.store.get(head)) as CouncilData)
      : {};

    const councilProposals = myCouncilData.proposals
      ? myCouncilData.proposals
      : [];
    this.logger.log('gossip proposals');

    this.db.proposals.each((localProposal, cursor) => {
      if (councilProposals.findIndex((p) => p.id === cursor.key) === -1) {
        const proposal = {
          id: cursor.key,
        };
        this.logger.log('gossiping', proposal);
        councilProposals.push(proposal);
      }
    });

    myCouncilData.proposals = [...councilProposals];
    this.logger.log('CouncilData Updated to', myCouncilData);
    return this.store.create(myCouncilData);
  }

  async getCouncilDataOf(member: string, block?: number): Promise<CouncilData> {
    block = block || (await this.db.meta.get('block')).value;
    const head = await this.connection.getMutableHead(
      member,
      COUNCIL_KEYS,
      block
    );
    if (!head) {
      this.logger.log(`Council Data of ${member} is undefined`);
      return {};
    }

    const councilData = await this.store.get(head);
    this.logger.log(`Council Data of ${member}`, councilData);
    return councilData ? councilData : {};
  }

  /** check the proposal had enough votes at block */
  async getProposalStatus(
    proposalId: string,
    at?: number
  ): Promise<ProposalStatus> {
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

    const votesCastedLocal = await this.db.votes
      .where('proposalId')
      .equals(proposalId)
      .toArray();

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
      (member) =>
        votesCasted.findIndex((casted) => casted.member === member) === -1
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

    const council = await this.connection.getCouncil(at);

    this.logger.log(`Fetch council data`, { council });

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
  }

  cacheProposals(data: CouncilData, at: number): Promise<void>[] {
    if (data.proposals === undefined) return [];

    this.logger.log(`caching proposals of `, { data });

    return data.proposals.map(async (councilProposal) =>
      this.cacheProposal(councilProposal, at)
    );
  }

  async cacheProposal(councilProposal: CouncilProposal, at): Promise<void> {
    const proposalId = councilProposal.id;
    // store proposals of that member on my local db.
    const mine = await this.db.proposals.get(proposalId);

    this.logger.log(`caching proposal ${proposalId}`, { mine });

    // if I have it and is not pending, that's it.
    if (mine && mine.status !== ProposalStatus.Pending) return;

    const proposal = mine || (await this.initLocalProposal(proposalId));
    proposal.status = await this.getProposalStatus(proposalId, at);

    this.logger.log(`adding proposal to cache ${proposalId}`, { proposal });
    await this.db.proposals.put(proposal);

    /** accepted proposals are converted into valid perspectives */
    if (proposal.status === ProposalStatus.Accepted) {
      await Promise.all(
        proposal.updates.map(async (update) => {
          const perspective = (await this.store.get(
            update.perspectiveId
          )) as Signed<Perspective>;
          await this.db.perspectives.put({
            id: update.perspectiveId,
            context: perspective.payload.context,
            headId: update.newHeadId,
          });
        })
      );
    }
  }

  cacheVotes(data: CouncilData, at: number, member: string): Promise<void>[] {
    if (data.votes === undefined) return [];

    this.logger.log(`caching votes of`, { data });

    return data.votes.map(async (vote) => {
      const voteId = `${vote.proposalId}-${vote.member}`;
      const myCopy = await this.db.votes.get(voteId);

      this.logger.log(`caching vote of`, { vote, myCopy });

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

      this.logger.log(`adding vote to cache`, { vote });
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
    const proposalManifest = (await this.store.get(
      proposalId
    )) as ProposalManifest;
    if (!proposalManifest) throw new Error(`Proposal ${proposalId} not found`);
    return proposalManifest;
  }

  async initLocalProposal(proposalId: string): Promise<LocalProposal> {
    const proposalManifest = await this.getProposalManifest(proposalId);
    return {
      id: proposalId,
      toPerspectiveId: proposalManifest.toPerspectiveId,
      updates: proposalManifest.updates,
      status: ProposalStatus.Pending,
      endBlock: proposalManifest.block + proposalManifest.config.duration,
    };
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    await this.ready();
    /** at this point cache data is up to date */
    this.logger.log(`getting perspective ${perspectiveId}`);
    const perspective = await this.db.perspectives.get(perspectiveId);
    return { headId: perspective ? perspective.headId : undefined };
  }

  async getContextPerspectives(context: string) {
    await this.ready();
    const perspectives = await this.db.perspectives
      .where('context')
      .equals(context)
      .toArray();

    this.logger.log(`getting context perspectives ${context}`, perspectives);

    return perspectives.map((e) => e.id);
  }

  async addProposalToCouncilData(
    councilProposal: CouncilProposal,
    at?: number
  ) {
    at = at || (await this.db.meta.get('block')).value;
    if (this.connection.account === undefined)
      throw new Error('user not logged in');
    const myCouncilData = await this.getCouncilDataOf(this.connection.account);

    let newCouncilData = { ...myCouncilData };
    if (newCouncilData.proposals === undefined) {
      newCouncilData.proposals = [];
    }

    const ix = newCouncilData.proposals.findIndex(
      (p) => p.id === councilProposal.id
    );
    if (ix === -1) {
      newCouncilData.proposals.push(councilProposal);
    } else {
      newCouncilData.proposals.splice(ix, 1, councilProposal);
    }

    this.logger.log(`addProposalToCouncilData`, {
      myCouncilData,
      newCouncilData,
    });

    return newCouncilData;
  }

  async addVoteToCouncilData(vote: Vote, at?: number) {
    if (this.connection.account === undefined)
      throw new Error('user not logged in');
    const myCouncilData = await this.getCouncilDataOf(
      this.connection.account,
      at
    );

    let newCouncilData = { ...myCouncilData };
    if (newCouncilData.votes === undefined) {
      newCouncilData.votes = [];
    }

    const ix = newCouncilData.votes.findIndex(
      (v) => v.proposalId === vote.proposalId && v.member === vote.member
    );
    newCouncilData.votes.push(vote);

    this.logger.log(`addProposalToCouncilData`, {
      myCouncilData,
      newCouncilData,
    });

    return newCouncilData;
  }

  async createProposal(proposalManifest: ProposalManifest): Promise<string> {
    if (this.connection.account === undefined)
      throw new Error('user not logged in');
    if (!(await this.connection.canSign())) throw new Error('user cant sign');

    const proposalId = await this.store.create(proposalManifest);
    const council = await this.connection.getCouncil(proposalManifest.block);
    if (!council.includes(this.connection.account))
      throw new Error('user not a council member');

    const councilProposal: CouncilProposal = {
      id: proposalId,
    };

    const newCouncilData = await this.addProposalToCouncilData(councilProposal);
    const newCouncilDataHash = await this.store.create(newCouncilData);

    this.logger.log(`createProposal`, { newCouncilDataHash, newCouncilData });
    await this.updateCouncilData(newCouncilDataHash);

    /** cache this proposal on my localdb */
    const localProposal = await this.initLocalProposal(proposalId);

    this.logger.log(`caching proposal`, { proposalId, localProposal });
    await this.db.proposals.put(localProposal);

    return proposalId;
  }

  async getProposalsToPerspective(perspectiveId: string) {
    const proposals = this.db.proposals
      .where('toPerspectiveId')
      .equals(perspectiveId);
    const proposalIds = await proposals.primaryKeys();
    this.logger.log(`getProposalsToPerspective`, {
      perspectiveId,
      proposalIds,
    });
    return proposalIds;
  }

  async getProposalSummary(proposalId): Promise<ProposalSummary> {
    const proposal = await this.db.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (!proposal.status)
      throw new Error(`Proposal ${proposalId} status undefined`);

    const votes = await this.db.votes
      .where('proposalId')
      .equals(proposalId)
      .toArray();

    this.logger.log(`getProposalStatus`, { proposalId, proposal });
    const block = (await this.db.meta.get('block')).value;
    return {
      status: proposal.status,
      votes,
      block,
    };
  }

  async vote(proposalId: string, value: VoteValue) {
    if (!this.connection.account) throw new Error(`cant vote if not logged in`);

    const proposal = await this.db.proposals.get(proposalId);
    if (!proposal) throw new Error(`proposal not found ${proposalId}`);

    if (proposal.status !== ProposalStatus.Pending)
      throw new Error(
        `why are you trying to vote on a closed proposal ${proposalId}?`
      );

    const vote: Vote = {
      member: this.connection.account,
      proposalId,
      value,
    };
    const newCouncilData = await this.addVoteToCouncilData(vote);
    const newCouncilDataHash = await this.store.create(newCouncilData);
    this.logger.log(`vote`, { vote, newCouncilDataHash, newCouncilData });
    await this.updateCouncilData(newCouncilDataHash);

    /** update the proposal status based  */
    await this.fetchCouncilDatas();
  }
}
