export interface DAOMember {
  address: string,
  balance: string
}

export interface DAOConnector {
  connect(address: string): Promise<void>;
  getMembers(): Promise<DAOMember[]>;
  addMember(member: DAOMember): Promise<void>;
}