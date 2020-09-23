// import { CASStore } from '@uprtcl/multiplatform';
// import { Logger } from '@uprtcl/micro-orchestrator';
// import { PolkadotConnection } from './connection.polkadot';

// import { PerspectiveDetails, UpdateRequest } from '@uprtcl/evees';

// export interface CouncilProposal {
//   block: number;
//   updates: UpdateRequest[];
// }

// export interface ProposalConfig {
//   quorum: number;
//   thesehold: number;
// }

// export enum Vote {
//   Undefined = 'UNDEFINED',
//   Yes = 'YES',
//   No = 'NO'
// }

// export class EveesPolkadotCouncilProposals {
//   logger: Logger = new Logger('EveesPolkadotCouncilProposals');

//   constructor(
//     protected connection: PolkadotConnection,
//     public orbitdb: OrbitDBPolkadot,
//     public store: CASStore,
//     public config: ProposalConfig
//   ) {}

//   async getProposals() {
//     return this.orbitdb.getProposals();
//   }

//   async vote(proposalHash: string, value: Vote): Promise<void> {
//     await this.connection.vote(proposalHash, value);
//     const status = await this.checkProposal(proposalHash);
//     if (status) {
//       /** if the status is positive go on and cache it*/
//       this.orbitdb.updateCouncilPerspectives(proposalHash);
//     }
//   }

//   async getVotes(proposalHash: string, council: string[]): Promise<Vote[]> {
//     return Promise.all(
//       council.map(
//         async (member): Promise<Vote> => {
//           const memberVotes = await this.connection.getVotes(member);
//           if (memberVotes === undefined || memberVotes[proposalHash] === undefined) {
//             return Vote.Undefined;
//           }

//           return memberVotes[proposalHash];
//         }
//       )
//     );
//   }

//   checkVotes(votes: Vote[]) {
//     const N = votes.length;
//     const nYes = votes.filter(v => v === Vote.Yes).length;
//     const nNo = votes.filter(v => v === Vote.No).length;

//     return (nYes + nNo) / N >= this.config.quorum && nYes / nNo > this.config.thesehold;
//   }

//   async checkProposal(proposalHash: string): Promise<boolean> {
//     const proposal = (await this.store.get(proposalHash)) as CouncilProposal;
//     const council = this.connection.getCouncil(proposal.block);
//     const votes = await this.getVotes(proposalHash, council);
//     return this.checkVotes(votes);
//   }
// }
