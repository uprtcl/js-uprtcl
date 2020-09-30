export interface ProposalConfig {
  quorum: number;
  thresehold: number;
  duration: number;
}

export enum VoteValue {
  Undefined = 'UNDEFINED',
  Yes = 'YES',
  No = 'NO'
}

export enum ProposalStatus {
  Pending = 'Open',
  Rejected = 'Rejected',
  Accepted = 'Accepted'
}

export interface ProposalLogic {
  isPending(): boolean;
  status(): any;
  isApproved(): boolean;
  getVotes(): any[];
  addVote(any): void;
}
