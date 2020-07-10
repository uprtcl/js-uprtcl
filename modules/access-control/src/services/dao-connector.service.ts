export interface DAOMember {
  address: string;
  balance: string;
}

export interface DAOMemberProposal {
  id: string;
  address: string;
  yea: string;
  nay: string;
  possibleVotes: string;
}

export interface DAOConnector {
  connect(address: string): Promise<void>;
  getMembers(): Promise<DAOMember[]>;
  addMember(member: DAOMember): Promise<void>;
  getNewMemberProposals(): Promise<DAOMemberProposal[]>;
  vote(proposalId: string, value: boolean): Promise<void>;
}
