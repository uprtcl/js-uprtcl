import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { AddressOrPair, Signer } from '@polkadot/api/types';
import { stringToHex, bnToBn } from '@polkadot/util';
import {
  decodeAddress,
  encodeAddress,
  encodeDerivedAddress,
} from '@polkadot/util-crypto';
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp';
import { IdentityInfo, Registration } from '@polkadot/types/interfaces';
// import { ExtensionStore } from '@polkadot/ui-keyring/stores';

import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import {
  ChainConnectionDetails,
  ConnectionDetails,
} from '@uprtcl/evees-blockchain';

const getIdentityInfo = (identity: Option<Registration>) => {
  if (identity && identity.isSome) {
    const { info }: any = identity.toHuman();
    return info;
  }
  return {};
};

const UPRTCL_INDEX = 61880; // MAX 65535

const signSendAndMine = (
  submitable: any,
  account: AddressOrPair,
  api: ApiPromise
): Promise<TransactionReceipt> => {
  return new Promise(async (resolve, reject) => {
    const unsub = await submitable.signAndSend(account, async (result) => {
      if (result.status.isInBlock) {
      } else if (result.status.isFinalized) {
        if (unsub) unsub();
        // TODO: resolve with the txHash and the blockNumber
        const txHash = result.status.asFinalized.toHex(); // .toString() if string is needed
        const blockData = await api.rpc.chain.getBlock(txHash);
        if (blockData === undefined) throw new Error('blockData is undefined');

        resolve({
          txHash,
          blockNumber: <number>blockData.block.header.number.toJSON(),
        });
      }
    });
  });
};

// Picks out the the cid parts from the users additional fields and assembles the final string
const getCID = (info: IdentityInfo, keys: string[]): string | undefined => {
  if (!info.additional) {
    return '';
  }
  // const [[, { Raw: cid1 }], [, { Raw: cid0 }]] = (info.additional as any)
  //   .filter(([k]) => k.Raw === keys[0] || k.Raw === keys[1])
  //   .sort(([a], [b]) => (a.Raw > b.Raw ? -1 : 1));

  const cid1 = info.additional.find((entry: any[]) => entry[0].Raw === keys[0]);
  const cid0 = info.additional.find((entry: any[]) => entry[0].Raw === keys[1]);

  if (cid1 === undefined || cid0 === undefined) return undefined;

  return (cid1[1] as any).Raw + (cid0[1] as any).Raw;
};

export interface TransactionReceipt {
  txHash: string;
  blockNumber: number;
}

export class PolkadotConnection extends Connection {
  public api?: ApiPromise;
  public account?: string;
  public accounts?: string[];
  private chain?: string;
  private signer?: Signer;
  public connectionDetails: ConnectionDetails;
  private useDerivative: boolean = false;
  public identitiesCache: { [account: string]: any } = {};

  logger = new Logger('Polkadot-Connection');

  constructor(
    public connections: ChainConnectionDetails,
    public connectionName: string,
    options?: ConnectionOptions
  ) {
    super(options);
    if (connections[connectionName] === undefined) {
      throw new Error(
        `connection details for connection id '${connectionName}' not found`
      );
    }
    this.connectionDetails = connections[connectionName];
  }

  public async connect(): Promise<void> {
    this.logger.log('Connecting');

    const wsProvider = new WsProvider(this.connectionDetails.endpoint);
    this.api = await ApiPromise.create({ provider: wsProvider });
    this.chain = (await this.api.rpc.system.chain()).toString();
    this.useDerivative = this.api.tx.utility.asDerivative !== undefined;

    this.logger.log('Connected', {
      api: this.api,
    });
  }

  public getNetworkId() {
    return this.chain;
  }

  public async canSign(): Promise<boolean> {
    return this.signer !== undefined;
  }

  public async getAccounts(): Promise<string[]> {
    const allInjected = await web3Enable('uprtcl-wiki');

    this.accounts = (await web3Accounts()).map((a) =>
      encodeAddress(decodeAddress(a.address), 42)
    );
    return this.accounts ? this.accounts : [];
  }

  public async connectWallet(): Promise<void> {
    if (!this.api) throw new Error('api not defined');

    if (!this.accounts) {
      await this.getAccounts();
    }
    if (!this.accounts) {
      throw new Error('accounts not defined');
    }
    this.account = this.accounts[0];

    // Set extension account as signer
    const injector = await web3FromAddress(this.account);
    this.api.setSigner(injector.signer);
    this.signer = injector.signer;
    return;
  }

  public async disconnectWallet(): Promise<void> {
    if (!this.api) throw new Error('api not defined');

    this.api.setSigner({});
    this.signer = undefined;
    this.account = undefined;
  }

  public async getIdentityInfo(userId: string) {
    if (!this.api) throw new Error('api not defined');
    const identity = await this.api.query.identity.identityOf(userId);
    return getIdentityInfo(<Option<Registration>>identity);
  }

  public async getMutableHead(
    userId: string,
    keys: string[],
    atBlock?: number
  ) {
    if (atBlock !== undefined) {
      this.logger.warn('cant get idenity at block yet... ups');
    }
    const derivedAccount = this.useDerivative
      ? encodeDerivedAddress(userId, UPRTCL_INDEX, 42)
      : userId;
    const identityInfo = await this.getIdentityInfo(derivedAccount);
    return getCID(<IdentityInfo>identityInfo, keys);
  }

  public async updateMutableHead(
    head: string | undefined,
    keys: string[]
  ): Promise<TransactionReceipt> {
    if (!this.account)
      throw new Error('cannot update identity if account not defined');
    // update evees entry
    const cid1 = head !== undefined ? head.substring(0, 32) : '';
    const cid0 = head !== undefined ? head.substring(32, 64) : '';

    const derivedAccount = this.useDerivative
      ? encodeDerivedAddress(this.account, UPRTCL_INDEX, 42)
      : this.account;
    if (!this.api) throw new Error('api undefined');

    this.logger.log(
      `Using derived account ${derivedAccount} for current address ${this.account}`
    );

    const identityInfo = await this.getIdentityInfo(derivedAccount);
    const additional = identityInfo.additional ? identityInfo.additional : [];

    const currentIndexes = [
      additional.findIndex((entry) => entry[0].Raw === keys[0]),
      additional.findIndex((entry) => entry[0].Raw === keys[1]),
    ];

    if (!currentIndexes.includes(-1)) {
      additional[currentIndexes[0]][1].Raw = cid1;
      additional[currentIndexes[1]][1].Raw = cid0;
    } else {
      additional.push(
        [{ Raw: keys[0] }, { Raw: cid1 }],
        [{ Raw: keys[1] }, { Raw: cid0 }]
      );
    }

    const newIdentity = {
      ...(identityInfo as any),
      additional: [...additional],
    };

    /** check balance is enough, and if it's not, send the missing balance */
    const derivedAccountInfo = await this.api.query.system.account(
      derivedAccount
    );
    const amountToFreeze = this.api.consts.identity.basicDeposit.add(
      this.api.consts.identity.fieldDeposit.mul(
        bnToBn(newIdentity.additional.length)
      )
    );

    if (derivedAccountInfo.data.reserved.lt(amountToFreeze)) {
      const missing = amountToFreeze.sub(derivedAccountInfo.data.feeFrozen);
      /** not enough balance free */
      let r = confirm(
        `Your Uprtcl account \n\n${derivedAccount} \n\ndoes not have enough balance. \n\nSend ${missing.div(
          bnToBn('1000000000000')
        )} KSM to it?`
      );
      if (!r) {
        throw new Error('Not enough funds');
      }
      const txHash = await signSendAndMine(
        this.api.tx.balances.transfer(derivedAccount, missing),
        this.account,
        this.api
      );
    }

    const setIdentity = this.api.tx.identity.setIdentity(newIdentity);
    const submitable = this.useDerivative
      ? this.api.tx.utility.asDerivative(UPRTCL_INDEX, setIdentity)
      : setIdentity;

    return signSendAndMine(submitable, this.account, this.api);
  }

  public async signText(messageText): Promise<string> {
    if (this.signer === undefined) throw new Error('signer not found');
    if (this.signer.signRaw === undefined) throw new Error('signer not found');
    if (this.account === undefined) throw new Error('account not found');

    const { signature } = await this.signer.signRaw({
      address: this.account,
      data: stringToHex(messageText),
      type: 'bytes',
    });
    return signature;
  }

  public async getCouncil(at?: number): Promise<string[]> {
    if (!this.api) throw new Error('api undefined');
    at = at || (await this.getLatestBlock());
    const blockHash = await this.api.rpc.chain.getBlockHash(at);
    const councilAddr = await this.api.query.council.members.at(blockHash);
    return councilAddr.map((address) =>
      encodeAddress(decodeAddress(address), 42)
    );
  }

  public async getLatestBlock(): Promise<number> {
    if (!this.api) throw new Error('api undefined');
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }
}
