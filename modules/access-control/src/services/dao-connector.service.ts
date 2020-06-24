export interface DAOConnector {
  connect(address: string): Promise<void>;
  getMembers(): Promise<string[]>;
}