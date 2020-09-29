import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PerspectiveDetails } from '@uprtcl/evees';

import { PolkadotConnection } from '../connection.polkadot';
import { EveesCouncilDB } from './dexie.council.store';

import { CouncilData, DexieProposal, ProposalManifest } from './types';
import { getProposalStatus, isValid } from './proposal.logic';
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

  /* in memory cache */
  protected council!: string[];

  constructor(
    protected connection: PolkadotConnection,
    public store: CASStore,
    public config: ProposalConfig
  ) {
    this.db = new EveesCouncilDB();
  }

  async init() {
    this.council = await this.connection.getCouncil();
    await this.fetchCouncilDatas();
  }

  async ready(): Promise<void> {
    if (!this.initialized) {
      return this.init();
    }
  }

  /** reads all the council datas and populate the DB */
  async fetchCouncilDatas() {
    const councilDatas = await Promise.all(
      this.council.map(async member => {
        const head = await this.connection.getHead(member, COUNCIL_KEYS);
        if (!head) return {};
        return (await this.store.get(head)) as CouncilData;
      })
    );

    await this.db.transaction('rw', [this.db.proposals], async () => {
      await Promise.all(
        councilDatas.map(data => {
          if (data.proposals !== undefined) {
            if (data.proposals) this.db.proposals.bulkAdd(data.proposals);
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
  async verifyProposal(proposalId: string, atBlock: number): Promise<boolean> {
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
    const votes = await Promise.all(
      council.map(async member => {
        const memberCouncilData = await this.getCouncilDataOf(member, atBlock);
        return memberCouncilData.votes ? memberCouncilData.votes[proposalId] : undefined;
      })
    );

    return isValid(getProposalStatus(manifest, votes, atBlock));
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
        if (valid) {
          /** cache the verification */
          proposal.verified = true;
          this.db.proposals.put(proposal, proposal.id);
          return true;
        }
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

    const updatedPerspectives = proposalManifest.updates.map(update => update.perspectiveId);

    const dexieProposal: DexieProposal = {
      id: proposalId,
      toPerspectiveId: proposalManifest.toPerspectiveId,
      updatedPerspectives: updatedPerspectives,
      updates: proposalManifest.updates
    };

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
}
