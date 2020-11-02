import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { AddressOrPair, Signer } from '@polkadot/api/types';
import { stringToHex } from '@polkadot/util';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { IdentityInfo, Registration } from '@polkadot/types/interfaces';
// import { ExtensionStore } from '@polkadot/ui-keyring/stores';

import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { ChainConnectionDetails, ConnectionDetails } from '@uprtcl/evees-blockchain';

const getIdentityInfo = (identity: Option<Registration>) => {
  if (identity && identity.isSome) {
    const { info }: any = identity.toHuman();
    return info;
  }
  return {};
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

  logger = new Logger('Polkadot-Connection');

  constructor(
    public connections: ChainConnectionDetails,
    public connectionName: string,
    options?: ConnectionOptions
  ) {
    super(options);
    this.connectionDetails = connections[connectionName];
  }

  public async connect(): Promise<void> {
    this.logger.log('Connecting');

    const wsProvider = new WsProvider(this.connectionDetails.endpoint);
    this.api = await ApiPromise.create({ provider: wsProvider });
    this.chain = (await this.api.rpc.system.chain()).toString();

    this.logger.log('Connected', {
      api: this.api
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

    this.accounts = (await web3Accounts()).map(a => a.address);
    return this.accounts ? this.accounts : [];
  }

  public async connectWallet(userId?: string): Promise<void> {
    if (!this.api) throw new Error('api not defined');

    if (!this.accounts) {
      await this.getAccounts();
    }
    this.account = userId ?? this.accounts![0];

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

  public async getMutableHead(userId: string, keys: string[], atBlock?: number) {
    if (atBlock !== undefined) {
      this.logger.warn('cant get idenity at block yet... ups');
    }
    const identityInfo = await this.getIdentityInfo(userId);
    return getCID(<IdentityInfo>identityInfo, keys);
  }

  public async updateMutableHead(
    head: string | undefined,
    keys: string[]
  ): Promise<TransactionReceipt> {
    if (!this.account) throw new Error('cannot update identity if account not defined');
    // update evees entry
    const cid1 = head !== undefined ? head.substring(0, 32) : '';
    const cid0 = head !== undefined ? head.substring(32, 64) : '';

    const identityInfo = await this.getIdentityInfo(this.account);
    const additional = identityInfo.additional ? identityInfo.additional : [];

    const currentIndexes = [
      additional.findIndex(entry => entry[0].Raw === keys[0]),
      additional.findIndex(entry => entry[0].Raw === keys[1])
    ];

    if (!currentIndexes.includes(-1)) {
      additional[currentIndexes[0]][1].Raw = cid1;
      additional[currentIndexes[1]][1].Raw = cid0;
    } else {
      additional.push([{ Raw: keys[0] }, { Raw: cid1 }], [{ Raw: keys[1] }, { Raw: cid0 }]);
    }

    const newIdentity = {
      ...(identityInfo as any),
      additional: [...additional]
    };

    if (!this.api) throw new Error('api undefined');
    const result = this.api.tx.identity.setIdentity(newIdentity);

    // TODO: Dont block here, cache value
    return new Promise(async (resolve, reject) => {
      if (result === undefined) reject();
      if (this === undefined) reject();

      const unsub = await result.signAndSend(<AddressOrPair>this.account, async result => {
        if (result.status.isInBlock) {
        } else if (result.status.isFinalized) {
          if (unsub) unsub();
          if (this.api === undefined) throw new Error('api is undefined');

          // TODO: resolve with the txHash and the blockNumber
          const txHash = result.status.asFinalized.toHex(); // .toString() if string is needed
          const blockData = await this.api.rpc.chain.getBlock(txHash);
          if (blockData === undefined) throw new Error('blockData is undefined');

          resolve({
            txHash,
            blockNumber: <number>blockData.block.header.number.toJSON()
          });
        }
      });
    });
  }

  public async signText(messageText): Promise<string> {
    if (this.signer === undefined) throw new Error('signer not found');
    if (this.signer.signRaw === undefined) throw new Error('signer not found');
    if (this.account === undefined) throw new Error('account not found');

    const { signature } = await this.signer.signRaw({
      address: this.account,
      data: stringToHex(messageText),
      type: 'bytes'
    });
    return signature;
  }

  public async getCouncil(at?: number): Promise<string[]> {
    if (!this.api) throw new Error('api undefined');
    const blockHash = await this.api.rpc.chain.getBlockHash(at);
    const councilAddr = await this.api.query.council.members.at(blockHash);
    return councilAddr.map(address => address.toString());
  }

  public async getLatestBlock(): Promise<number> {
    if (!this.api) throw new Error('api undefined');
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }
}
