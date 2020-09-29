import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PerspectiveDetails } from '@uprtcl/evees';

import { PolkadotConnection } from '../connection.polkadot';
import { EveesCouncilDB } from './dexie.council.store';

import { CouncilData, DexieProposal, ProposalManifest, ProposalStatusCache } from './types';
import { getProposalStatus, getIsValid, ProposalLogicQuorum } from './proposal.logic.quorum';
import { ProposalConfig } from './proposal.config.types';

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

  /** reads all the council datas and populate the DB */
  async fetchCouncilDatas() {
    const council = await this.connection.getCouncil();

    await this.db.transaction('rw', [this.db.proposals], async () => {
      await Promise.all(
        council.map(async member => {
          // get council data of member.
          const head = await this.connection.getHead(member, COUNCIL_KEYS);
          if (!head) return;

          const data = (await this.store.get(head)) as CouncilData;
          if (data.proposals !== undefined) {
            data.proposals.map(async proposal => {
              // store proposals of that member on my local db.
              const mine = this.db.proposals.get(proposal.id);
              if (mine === undefined) {
                // if the proposal is new to me
                if (proposal.blockEnd !== undefined) {
                  // if closed, verify it and if valid, store it in local storage.
                  const valid = await this.verifyProposal(proposal.id, proposal.blockEnd);
                  if (valid) {
                    proposal.verified = true;
                    this.db.proposals.add(proposal);
                  } else {
                    this.logger.error(
                      `proposal ${proposal.id} from council member ${member} is corrupted!`
                    );
                  }
                } else {
                  // if proposal not yet closed, see if it closed.
                  const status = await this.computeStatus(proposal.id, this.connection.getLatestBlock());
                  if (status !== ProposalStatus.P)
                }
              }
            });
          }
        })
      );
    });
  }

  /* council at is a constant function, can be cached */
  async getCouncil(at: number) {
    return this.connection.getCouncil(at);
  }

  async updateCouncilData(hash: string) {
    return this.connection.updateHead(hash, COUNCIL_KEYS);
  }

  async getCouncilDataOf(member: string, block?: number): Promise<CouncilData> {
    const head = await this.connection.getHead(member, COUNCIL_KEYS, block);
    if (head === undefined) return {};
    const councilData = await this.store.get(head);
    return councilData ? councilData : {};
  }

  /** check the proposal had enough votes at block */
  async isApproved(proposalId: string, atBlock: number): Promise<any> {
    const manifest = (await this.store.get(proposalId)) as ProposalManifest;

    if (manifest.config.duration !== EXPECTED_CONFIG.duration) {
      this.logger.error(`unexpected duration ${manifest.config.duration}`);
      return false;
    }
    if (manifest.config.quorum !== EXPECTED_CONFIG.quorum) {
      this.logger.error(`unexpected quorum ${manifest.config.quorum}`);
      return false;
    }
    if (manifest.config.thresehold !== EXPECTED_CONFIG.thresehold) {
      this.logger.error(`unexpected thresehold ${manifest.config.thresehold}`);
      return false;
    }

    const council = await this.connection.getCouncil(manifest.block);
    const memberVotes = await Promise.all(
      council.map(async member => {
        const memberCouncilData = await this.getCouncilDataOf(member, atBlock);
        const voteValue = memberCouncilData.votes ? memberCouncilData.votes[proposalId] : undefined;
        return { member, value: voteValue };
      })
    );

    const proposalLogic = new ProposalLogicQuorum(
      manifest,
      memberVotes.map(memberVote => memberVote.value),
      atBlock
    );

    return proposalLogic.isApproved();
  }

  async verifyProposal(proposalId: string, atBlock: number): Promise<boolean> {
    const status = await this.... WHAT !!! (proposalId, atBlock);
    const isValid = getIsValid(status);
    return isValid;
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    await this.ready();
    /** assume cache data is uptodate */
    const proposals = this.db.proposals
      .where('updatedPerspectives')
      .equals(perspectiveId)
      .and(proposal => proposal.blockEnd !== undefined);

    const proposalsSorted = await proposals.sortBy('blockEnd');

    /** check validity */
    const validProposal = proposalsSorted.find(async proposal => {
      if (proposal.verified) {
        return true;
      } else {
        if (!proposal.blockEnd) return false;

        const valid = await this.verifyProposal(proposal.id, proposal.blockEnd);
        return valid;
      }
    });

    if (!validProposal) return {};

    const update = validProposal.updates.find(u => u.perspectiveId === perspectiveId);
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

    const dexieProposal = await this.initDexieProposal(proposalId);

    newCouncilData.proposals.push(dexieProposal);
    const newCouncilDataHash = await this.store.create(newCouncilData);
    await this.updateCouncilData(newCouncilDataHash);

    /** cache this proposal for filtering */
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

  async getProposalStatus(proposalId): Promise<ProposalStatusCache> {
    /* check if already computed and verified */
    const proposal = await this.db.proposals.get(proposalId);
    if (proposal && proposal.verified && proposal.status) {
      return proposal.status;
    }

    /* not verified, maybe it's still open, 
    maybe its the first time this peer see this proposal */
    await this.verifyProposal(proposalId, await this.connection.getLatestBlock());
  }
}
