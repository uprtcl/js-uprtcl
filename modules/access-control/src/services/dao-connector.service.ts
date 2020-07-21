export interface DAOMember {
  address: string;
  balance: string;
}

export interface DAOProposal {
  type: string;
  id: string;
  yea: string;
  nay: string;
  possibleVotes: string;
  subject: any;
}
export interface DAOConnector {
  connect(address: string): Promise<void>;
  getMembers(): Promise<DAOMember[]>;
  addMember(member: DAOMember): Promise<void>;
  getNewMemberProposals(): Promise<DAOProposal[]>;
  vote(proposalId: string, value: boolean): Promise<void>;
  getDaoProposal(proposalId: string): Promise<DAOProposal>;
  getDaoProposalFromUprtclProposalId(proposalId: string): Promise<DAOProposal>;
  createAgentProposal(
    onContract: string,
    value: string,
    calldataEncoded: string
  );
}
