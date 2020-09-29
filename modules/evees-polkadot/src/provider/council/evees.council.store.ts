import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PerspectiveDetails } from '@uprtcl/evees';

import { PolkadotConnection } from '../connection.polkadot';
import { EveesCouncilDB } from './dexie.council.store';

import { CouncilData, DexieProposal, ProposalManifest, ProposalStatusCache } from './types';
import { ProposalLogicQuorum } from './proposal.logic.quorum';
import { ProposalConfig, ProposalLogic } from './proposal.config.types';

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

  async updateCouncilData(hash: string) {
    const newHash = await this.gossipProposals();
    return this.connection.updateHead(newHash, COUNCIL_KEYS);
  }

  async gossipProposals() {
    if (!this.connection.account) throw new Error('cant update data if not logged in');
    // gossip consist on adding all new proposals to my own councilData object.
    const head = await this.connection.getHead(this.connection.account, COUNCIL_KEYS);
    const myCouncilData = head ? ((await this.store.get(head)) as CouncilData) : {};

    const proposals = myCouncilData.proposals ? myCouncilData.proposals : [];
    this.db.proposals.each(proposal => {
      if (proposals.findIndex(myProposal => myProposal.id === proposal.id) === -1) {
        proposals.push(proposal);
      }
    });

    myCouncilData.proposals = [...proposals];
    return this.store.create(myCouncilData);
  }

  async getCouncilDataOf(member: string, block?: number): Promise<CouncilData> {
    const head = await this.connection.getHead(member, COUNCIL_KEYS, block);
    if (head === undefined) return {};
    const councilData = await this.store.get(head);
    return councilData ? councilData : {};
  }

  /** check the proposal had enough votes at block */
  async getProposalLogic(proposalId: string, atBlock: number): Promise<ProposalLogic> {
    const manifest = (await this.store.get(proposalId)) as ProposalManifest;

    if (manifest.config.duration !== EXPECTED_CONFIG.duration) {
      throw new Error(`unexpected duration ${manifest.config.duration}`);
    }
    if (manifest.config.quorum !== EXPECTED_CONFIG.quorum) {
      throw new Error(`unexpected quorum ${manifest.config.quorum}`);
    }
    if (manifest.config.thresehold !== EXPECTED_CONFIG.thresehold) {
      throw new Error(`unexpected thresehold ${manifest.config.thresehold}`);
    }

    const council = await this.connection.getCouncil(manifest.block);
    const memberVotes = await Promise.all(
      council.map(async member => {
        const memberCouncilData = await this.getCouncilDataOf(member, atBlock);
        const voteValue = memberCouncilData.votes ? memberCouncilData.votes[proposalId] : undefined;
        return { member, value: voteValue };
      })
    );

    return new ProposalLogicQuorum(
      manifest,
      memberVotes.map(memberVote => memberVote.value),
      atBlock
    );
  }

  /** reads all the council datas and populate the DB */
  async fetchCouncilDatas() {
    const council = await this.connection.getCouncil();

    await Promise.all(
      council.map(async member => {
        // get council data of member.
        const head = await this.connection.getHead(member, COUNCIL_KEYS);
        if (!head) return;

        const data = (await this.store.get(head)) as CouncilData;
        if (data.proposals !== undefined) {
          data.proposals.map(async proposal => {
            // store proposals of that member on my local db.
            const mine = await this.db.proposals.get(proposal.id);

            // if I have it and is verified, that's it.
            if (mine && mine.blockEnd) return;

            // if the proposal is new to me
            if (proposal.blockEnd !== undefined) {
              const logic = await this.getProposalLogic(proposal.id, proposal.blockEnd);
              // if approved, verify it and if valid, store it in local storage.
              if (logic.isApproved()) {
                if (mine === undefined) {
                  // if it's new to me
                  this.db.proposals.add(proposal);
                } else {
                  // if I already had it, but not verified
                  this.db.proposals.put(proposal, proposal.id);
                }
              } else {
                this.logger.error(
                  `Corrupt state for proposal ${proposal.id} comming from councile member ${member}`
                );
              }
            } else {
              // if proposal not yet closed, see if it is closed.
              const logic = await this.getProposalLogic(
                proposal.id,
                await this.connection.getLatestBlock()
              );
              if (logic.isPending()) {
                // add it as pending (with blockEnd undefined)
                if (mine === undefined) {
                  this.db.proposals.add(proposal);
                } else {
                  this.db.proposals.put(proposal, proposal.id);
                }
              } else {
                this.logger.error(
                  `Corrupt state for proposal ${proposal.id} comming from council member ${member}`
                );
              }
            }
          });
        }
      })
    );

    // after this promise, my local DB will be synched with data the rest of council members
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    await this.ready();
    /** assume cache data is uptodate */
    const proposals = this.db.proposals
      .where('updatedPerspectives')
      .equals(perspectiveId)
      .and(proposal => proposal.blockEnd !== undefined);

    const proposalsSorted = await proposals.sortBy('blockEnd');

    const update = proposalsSorted[0].updates.find(u => u.perspectiveId === perspectiveId);
    return update ? { headId: update.newHeadId } : {};
  }

  async createProposal(proposalManifest: ProposalManifest): Promise<string> {
    if (this.connection.account === undefined) throw new Error('user not logged in');
    if (!(await this.connection.canSign())) throw new Error('user cant sign');

    const proposalId = await this.store.create(proposalManifest);
    const council = await this.connection.getCouncil();
    if (!council.includes(this.connection.account)) throw new Error('user not a council member');

    const myCouncilData = await this.getCouncilDataOf(this.connection.account);
    let newCouncilData = { ...myCouncilData };
    if (newCouncilData.proposals === undefined) {
      newCouncilData.proposals = [];
    }

    const dexieProposal: DexieProposal = {
      id: proposalId,
      toPerspectiveId: proposalManifest.toPerspectiveId,
      updatedPerspectives: proposalManifest.updates.map(update => update.perspectiveId),
      updates: proposalManifest.updates
    };

    newCouncilData.proposals.push(dexieProposal);
    const newCouncilDataHash = await this.store.create(newCouncilData);

    await this.updateCouncilData(newCouncilDataHash);

    /** cache this proposal on my localdb */
    await this.db.proposals.add(dexieProposal);

    return proposalId;
  }

  async getProposalsToPerspective(perspectiveId: string) {
    const proposals = await this.db.proposals
      .where('toPerspectiveId')
      .equals(perspectiveId)
      .toArray();

    return proposals.map(p => p.id);
  }

  async getProposal(proposalId): Promise<DexieProposal> {
    const proposal = await this.db.proposals.get(proposalId);
    if (!proposal) throw new Error(`proposal ${proposalId} not on memory`);
    return proposal;
  }
}
