import { TemplateResult } from 'lit-html';

/** an evees blockchain connection keeps a mutable hash associated
 * to a userId */
export interface BlockchainConnection {
  connection: any;
  account?: string | undefined;
  icon?(): TemplateResult;
  avatar?(userId: string, config: any): TemplateResult;
  getNetworkId(): string;
  getLatestBlock(): Promise<number>;
  getHead(userId: string, block?: number): Promise<string | undefined>;
  updateHead(head: string | undefined): Promise<void>;
  canSign(): Promise<boolean>;
  connectWallet(userId?: string): Promise<void>;
  disconnectWallet(): Promise<void>;
  ready(): Promise<void>;
}
