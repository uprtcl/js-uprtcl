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
