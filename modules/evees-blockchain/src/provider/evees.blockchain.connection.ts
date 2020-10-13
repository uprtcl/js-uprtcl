/** an evees blockchain connection keeps a mutable hash associated
 * to a userId */
export interface BlockchainConnection {
  account: string;
  getNetworkId(): Promise<string>;
  getLatestBlock(): Promise<number>;
  getHead(userId: string, block?: number): Promise<string | undefined>;
  updateHead(head: string): Promise<void>;
  canSign(): Promise<boolean>;
  connectWallet(userId?: string): Promise<void>;
  disconnectWallet(): Promise<void>;
  ready(): Promise<void>;
}