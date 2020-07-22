import { connect, Organization, describeScript, App } from '@aragon/connect';
import { TokenManager, Token } from '@aragon/connect-thegraph-token-manager';
import { Voting, Vote } from '@aragon/connect-thegraph-voting';

import { fetchRepo, getOrgAddress } from './helpers';

import {
  EthereumConnection,
  EthereumContract,
} from '@uprtcl/ethereum-provider';

import { DAOConnector, DAOMember, DAOProposal } from './dao-connector.service';
import { abi as abiVoting } from './aragon-voting-abi.json';

const MAIN_SUBGRAPH_RINKEBY =
  'https://api.thegraph.com/subgraphs/name/aragon/aragon-rinkeby';

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

type VoteWithDescription = Vote & { txRequest?: TransactionRequest };

function voteId(id: string) {
  return String(parseInt(id.match(/voteId:(.+)$/)?.[1] || '0'));
}

export class AragonConnector implements DAOConnector {
  org!: Organization;
  apps!: App[];
  tokenManager!: TokenManager;
  token!: Token;
  voting!: Voting;
  agentAddress!: string;

  constructor(protected eth: EthereumConnection) {}

  async createDao(parameters: any) {
    const TEMPLATE_NAME = 'membership-template';

    const { data } = await fetchRepo(TEMPLATE_NAME, MAIN_SUBGRAPH_RINKEBY);

    // parse data from last version published
    const { lastVersion } = data.repos[0];
    const templateAddress = lastVersion.codeAddress;
    const templateArtifact = JSON.parse(lastVersion.artifact);

    // create template contract
    const templateContract = new this.eth.web3.eth.Contract(
      templateArtifact.abi,
      templateAddress
    );

    // Get the proper function we want to call; ethers will not get the overload
    // automatically, so we take the proper one from the object, and then call it.
    const tx = await templateContract.methods['newInstance'].send();

    // Filter and get the org address from the events.
    const orgAddress = await getOrgAddress(
      'DeployDao',
      templateContract as any,
      tx.hash
    );

    return orgAddress;
  }

  async connect(address: string) {
    const agentCtr = new this.eth.web3.eth.Contract(abiVoting as any, address);
    const orgAddress = await agentCtr.methods.kernel().call();
    this.org = await connect(orgAddress, 'thegraph', { chainId: 4 });
    this.apps = await this.org.apps();

    const tokenApp = this.apps.find((app) => app.name === 'token-manager');
    const votingApp = this.apps.find((app) => app.name === 'voting');
    const agent = this.apps.find((app) => app.name === 'agent');

    if (!tokenApp) throw new Error('token manager not found');
    if (!votingApp) throw new Error('voting not found');
    if (!agent) throw new Error('agent app not found');

    this.agentAddress = agent.address;
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
    const votes: VoteWithDescription[] = await this.voting.votes();
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
          type: 'dao-proposal',
          owner: this.agentAddress,
          id: v.id,
          yea: v.yea,
          nay: v.nay,
          possibleVotes: v.votingPower,
          subject: { address: v.txRequest?.descriptionAnnotated[1].value },
        };
      });
  }

  async getDaoProposal(voteId: string) {
    const votes: VoteWithDescription[] = await this.voting.votes();
    const vote = votes.find((v) => v.id === voteId);
    if (!vote) throw new Error(`vote ${voteId} not found`);
    const proposal: DAOProposal = {
      type: 'dao-proposal',
      owner: this.agentAddress,
      id: vote.id,
      yea: vote.yea,
      nay: vote.nay,
      possibleVotes: vote.votingPower,
      subject: '',
    };
    return proposal;
  }

  async getDaoProposalFromUprtclProposalId(
    uprtclProposalId: string
  ): Promise<DAOProposal> {
    const votes: VoteWithDescription[] = await this.voting.votes();

    const vote = votes.find(
      (v) => v.script.indexOf(uprtclProposalId.slice(2)) !== -1
    );

    if (!vote) throw new Error(`vote ${voteId} not found`);
    const proposal: DAOProposal = {
      type: 'dao-proposal',
      id: vote.id,
      owner: this.agentAddress,
      yea: vote.yea,
      nay: vote.nay,
      possibleVotes: vote.votingPower,
      subject: '',
    };
    return proposal;
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

  async createAgentProposal(
    onContract: string,
    value: string,
    calldataEncoded: string
  ) {
    const intent = this.org.appIntent(this.agentAddress, 'execute', [
      onContract,
      value,
      calldataEncoded,
    ]);
    const paths = await intent.paths(this.eth.getCurrentAccount());
    await this.eth.sendTransaction(paths.transactions[0]);
  }
}
