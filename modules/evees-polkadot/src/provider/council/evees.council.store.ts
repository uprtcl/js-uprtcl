import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PerspectiveDetails } from '@uprtcl/evees';

import { PolkadotConnection } from '../connection.polkadot';
import { EveesCouncilDB } from './dexie.council.store';

import { CouncilData, ProposalConfig } from './types';

const COUNCIL_KEYS = ['evees-council-cid1', 'evees-council-cid0'];

/* a store that keeps track of the council common state regarding the council proposals */
export class PolkadotCouncilEveesStorage {
  logger: Logger = new Logger('PolkadotCouncilEveesStorage');
  protected db: EveesCouncilDB;

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

  /** reads all the council datas and populate the DB */
  async fetchCouncilDatas() {
    const councilDatas = await Promise.all(
      this.council.map(async member => {
        const head = await this.connection.getHead(member, COUNCIL_KEYS);
        return (await this.store.get(head)) as CouncilData;
      })
    );

    await this.db.transaction('rw', [this.db.proposals], async () => {
      await Promise.all(
        councilDatas.map(data => {
          this.db.proposals.bulkAdd(
            data.proposals.map(proposal => {
              return {
                id: proposal.id,
                toPerspectiveId: proposal.toPerspectiveId,
                blockStart: proposal.TBD
              };
            })
          );
        })
      );
    });
  }

  /* council at is a constant function, can be cached */
  async getCouncil(at: number) {
    const councilCache = await this.db.council.where('block').equals(at);
    if ((await councilCache.count()) > 0) {
      return councilCache.toArray;
    }

    const council = await this.connection.getCouncil(at);
    await Promise.all(council.map(member => this.db.council.add({ block: at, member })));
    return council;
  }

  /** check the proposal had enough votes at block */
  async verifyProposal(proposalId: string, block: number): Promise<boolean> {
    return true;
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    /** assume cache data is uptodate */
    // TODO search attestations backwards.
    const proposals = this.db.proposals
      .where('updatedPerspectives')
      .equals(perspectiveId)
      .and(proposal => proposal.blockEnd !== undefined);

    const proposalsSorted = await proposals.sortBy('blockEnd');

    /** check validity */
    const validProposal = proposalsSorted.find(async proposal => {
      if (proposal.verified) {
        return proposal;
      } else {
        const valid = await this.verifyProposal(proposal.id, proposal.blockEnd);
        if (valid) {
          return proposal;
        }
      }
    });

    if (!validProposal) return {};

    const update = validProposal.updates.find(u => u.perspectiveId === perspectiveId);
    return update ? update.head : {};
  }

  // async vote(proposalHash: string, value: Vote): Promise<void> {
  //   await this.connection.vote(proposalHash, value);
  //   const status = await this.checkProposal(proposalHash);
  //   if (status) {
  //     /** if the status is positive go on and cache it*/
  //     this.orbitdb.updateCouncilPerspectives(proposalHash);
  //   }
  // }

  // async getVotes(proposalHash: string, council: string[]): Promise<Vote[]> {
  //   return Promise.all(
  //     council.map(
  //       async (member): Promise<Vote> => {
  //         const memberVotes = await this.connection.getVotes(member);
  //         if (memberVotes === undefined || memberVotes[proposalHash] === undefined) {
  //           return Vote.Undefined;
  //         }

  //         return memberVotes[proposalHash];
  //       }
  //     )
  //   );
  // }

  // checkVotes(votes: Vote[]) {
  //   const N = votes.length;
  //   const nYes = votes.filter(v => v === Vote.Yes).length;
  //   const nNo = votes.filter(v => v === Vote.No).length;

  //   return (nYes + nNo) / N >= this.config.quorum && nYes / nNo > this.config.thesehold;
  // }

  // async checkProposal(proposalHash: string): Promise<boolean> {
  //   const proposal = (await this.store.get(proposalHash)) as CouncilProposal;
  //   const council = this.connection.getCouncil(proposal.block);
  //   const votes = await this.getVotes(proposalHash, council);
  //   return this.checkVotes(votes);
  // }
}
