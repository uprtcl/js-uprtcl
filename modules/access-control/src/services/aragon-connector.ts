import { DAOConnector, DAOMember } from './dao-connector.service';
import { connect, Organization } from '@aragon/connect';
import { TokenManager, Token } from '@aragon/connect-thegraph-token-manager';

import { EthereumConnection } from '@uprtcl/ethereum-provider';

const ALL_TOKEN_MANAGER_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/aragon/aragon-tokens-rinkeby';

export class AragonConnector implements DAOConnector {
  org!: Organization;
  tokenManager!: TokenManager;
  token!: Token;

  constructor(protected eth: EthereumConnection) {}

  async connect(address: string) {
    this.org = await connect(address, 'thegraph', { chainId: 4 });
    const apps = await this.org.apps();
    const tokenApp = apps.find((app) => app.name === 'token-manager');
    if (!tokenApp) throw Error('token app not found');

    this.tokenManager = new TokenManager(
      tokenApp.address,
      ALL_TOKEN_MANAGER_SUBGRAPH_URL,
      true
    );
    this.token = await this.tokenManager.token();
  }

  async getMembers(): Promise<DAOMember[]> {
    const holders = await this.token.holders();
    return holders.map((holder) => {
      return {
        address: holder.address,
        balance: holder.balance,
      };
    });
  }

  async addMember(member: DAOMember): Promise<void> {
    debugger;
    const intent = this.org.appIntent(this.tokenManager.appAddress, 'mint', [
      member.address,
      member.balance,
    ]);
    const txs = await intent.transactions(this.eth.getCurrentAccount());
    throw new Error('Method not implemented.');
  }
}
