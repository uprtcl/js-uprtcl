import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { AddressOrPair, Signer, SignerResult } from '@polkadot/api/types';
import { stringToHex } from '@polkadot/util';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { IdentityInfo, Registration } from '@polkadot/types/interfaces';
// import { ExtensionStore } from '@polkadot/ui-keyring/stores';

import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

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

export interface UserPerspectivesDetails {
  [perspectiveId: string]: {
    headId?: string;
    context?: string;
  };
}

export class PolkadotConnection extends Connection {
  public api?: ApiPromise;
  public account?: string;
  private chain?: string;
  private identityInfo?: IdentityInfo;
  private signer?: Signer;

  logger = new Logger('Polkadot-Connection');

  constructor(protected ws: string, protected apiOptions?: any, options?: ConnectionOptions) {
    super(options);
  }

  public async connect(): Promise<void> {
    this.logger.log('Connecting');

    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    this.api = await ApiPromise.create({ provider: wsProvider });
    // Retrieve the chain name
    // E.g. "Westend", "Kusama"
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

  public async connectWallet(): Promise<void> {
    const allInjected = await web3Enable('uprtcl-wiki');

    const allAccounts = await web3Accounts();
    this.account = allAccounts[0]?.address;

    // Set extension account as signer
    const injector = await web3FromAddress(this.account);
    this.api?.setSigner(injector.signer);
    this.signer = injector.signer;
    return;
  }

  public async getHead(userId: string, keys: string[], atBlockHash?: string) {
    if (atBlockHash !== undefined) {
      this.logger.error('cant get idenity at block yet... ups');
    }
    const identity = await this.api?.query.identity.identityOf(userId);
    this.identityInfo = getIdentityInfo(<Option<Registration>>identity);
    return getCID(<IdentityInfo>this.identityInfo, keys);
  }

  public async updateHead(head: string, keys: string[]) {
    // update evees entry
    const cid1 = head.substring(0, 32);
    const cid0 = head.substring(32, 64);
    const result = this.api?.tx.identity.setIdentity({
      ...(this.identityInfo as any),
      additional: [
        [{ Raw: keys[0] }, { Raw: cid1 }],
        [{ Raw: keys[1] }, { Raw: cid0 }]
      ]
    });
    // TODO: Dont block here, cache value
    await new Promise(async (resolve, reject) => {
      const unsub = await result?.signAndSend(<AddressOrPair>this?.account, result => {
        if (result.status.isInBlock) {
        } else if (result.status.isFinalized) {
          if (unsub) unsub();
          resolve();
        }
      });
    });
  }

  public async signText(messageText): Promise<string> {
    if (this.signer?.signRaw === undefined) throw new Error('signer not found');
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
    return this.api.query.council.members.at(blockHash);
  }

  public async getLatestBlock(): Promise<number> {
    if (!this.api) throw new Error('api undefined');
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }
}
