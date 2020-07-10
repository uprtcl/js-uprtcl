import { connect, Organization, describeScript, App } from '@aragon/connect';
import { TokenManager, Token } from '@aragon/connect-thegraph-token-manager';
import { Voting, Vote } from '@aragon/connect-thegraph-voting';

import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { DAOConnector, DAOMember } from './dao-connector.service';

const ALL_TOKEN_MANAGER_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/aragon/aragon-tokens-rinkeby';

const VOTING_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/aragon/aragon-voting-rinkeby';

interface Annotation {
  type: string;
  value: any;
}

interface TransactionRequest {
  description: string;
  descriptionAnnotated: Annotation[];
}

type VoteWithDescripton = Vote & { txRequest?: TransactionRequest };

function voteId(id: string) {
  return String(parseInt(id.match(/voteId:(.+)$/)?.[1] || '0'));
}

export class AragonConnector implements DAOConnector {
  org!: Organization;
  apps!: App[];
  tokenManager!: TokenManager;
  token!: Token;
  voting!: Voting;

  constructor(protected eth: EthereumConnection) {}

  async connect(address: string) {
    this.org = await connect(address, 'thegraph', { chainId: 4 });
    this.apps = await this.org.apps();
    const tokenApp = this.apps.find((app) => app.name === 'token-manager');
    const votingApp = this.apps.find((app) => app.name === 'voting');

    if (!tokenApp) throw new Error('token manager not found');
    if (!votingApp) throw new Error('voting not found');

    this.tokenManager = new TokenManager(
      tokenApp.address,
      ALL_TOKEN_MANAGER_SUBGRAPH_URL,
      true
    );
    this.token = await this.tokenManager.token();

    this.voting = new Voting(votingApp.address, VOTING_SUBGRAPH_URL, true);
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
    const intent = this.org.appIntent(this.tokenManager.appAddress, 'mint', [
      member.address,
      member.balance,
    ]);
    const paths = await intent.paths(this.eth.getCurrentAccount());
    await this.eth.sendTransaction(paths.transactions[0]);
  }

  async getNewMemberProposals() {
    const votes: VoteWithDescripton[] = await this.voting.votes();
    await Promise.all(
      votes.map(async (v) => {
        v.txRequest = (
          await describeScript(v.script, this.apps, this.org.provider)
        )[0] as TransactionRequest;
      })
    );
    return votes
      .filter(
        (v) =>
          !v.executed &&
          v.txRequest?.description.toLowerCase().indexOf('mint') !== -1
      )
      .map((v) => {
        return {
          id: v.id,
          address: v.txRequest?.descriptionAnnotated[1].value,
          yea: v.yea,
          nay: v.nay,
          possibleVotes: v.votingPower,
        };
      });
  }

  async vote(proposalId: string, value: boolean): Promise<void> {
    const intent = this.org.appIntent(this.voting.appAddress, 'vote', [
      voteId(proposalId),
      value,
      true,
    ]);
    const paths = await intent.paths(this.eth.getCurrentAccount());
    await this.eth.sendTransaction(paths.transactions[0]);
  }
}
