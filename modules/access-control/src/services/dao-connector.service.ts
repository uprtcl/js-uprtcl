export interface DAOMember {
  address: string;
  balance: string;
}

export interface NewDAOParameters {
  daoName: string;
  tokenName: string;
  tokenSymbol: string;
  members: string[];
  votingSettings: any;
  support?: any;
}

export interface DAOProposal {
  type: string;
  owner: string;
  id: string;
  yea: string;
  nay: string;
  possibleVotes: string;
  subject: any;
}
export interface DAOConnector {
  daoAddress: string;
  agentAddress: string;
  createDao(parameters: NewDAOParameters);
  orgAddresFromAgentAddress(agentAddress: string): Promise<string>;
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
