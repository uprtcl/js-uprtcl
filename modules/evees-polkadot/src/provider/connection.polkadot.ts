import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { AddressOrPair } from '@polkadot/api/types';
import { stringToU8a } from '@polkadot/util';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { IdentityInfo, IdentityInfoAdditional, Registration } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

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
const getCID = (info: IdentityInfo): string => {
  if (!info.additional) {
    return '';
  }
  const [[, { Raw: cid1 }], [, { Raw: cid0 }]] = (info.additional as any)
    .filter(([k]) => k.Raw === 'evees-cid1' || k.Raw === 'evees-cid0')
    .sort(([a], [b]) => (a.Raw > b.Raw ? -1 : 1));
  console.log(cid1, cid0);

  const cid = cid1 + cid0;
  return cid;
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

  logger = new Logger('Polkadot-Connection');

  constructor(protected ws: string, protected apiOptions?: any, options?: ConnectionOptions) {
    super(options);
  }

  public async connect(): Promise<void> {
    this.logger.log('Connecting');

    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    this.api = await ApiPromise.create({ provider: wsProvider });

    // const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    // const timestamp: any = await api.query.timestamp.now.at(blockHash);
    // const date = new Date(timestamp.toNumber());
    // Returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    const allInjected = await web3Enable('uprtcl-wiki');

    // returns an array of { address, meta: { name, source } }
    // meta.source contains the name of the extension that provides this account
    const allAccounts = await web3Accounts();
    this.account = allAccounts[0]?.address;

    // Set extension account as signer
    const injector = await web3FromAddress(this.account);
    this.api?.setSigner(injector.signer);

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
    return true;
  }

  public async connectWallet(): Promise<void> {
    // Returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    // const allInjected = await web3Enable('uprtcl-wiki');
    //
    // // returns an array of { address, meta: { name, source } }
    // // meta.source contains the name of the extension that provides this account
    // const allAccounts = await web3Accounts();
    // this.account = allAccounts[0]?.address;
    //
    // // Set extension account as signer
    // const injector = await web3FromAddress(this.account);
    // this.api?.setSigner(injector.signer);
    return;
  }

  public async getUserPerspectivesDetailsHash(userId: string) {
    const identity = await this.api?.query.identity.identityOf(userId);
    this.identityInfo = getIdentityInfo(<Option<Registration>>identity);
    return getCID(<IdentityInfo>this.identityInfo);
  }

  public async updateUserPerspectivesDetailsHash(userPerspectivesDetailsHash: string) {
    // update evees entry
    const cid1 = userPerspectivesDetailsHash.substring(0, 32);
    const cid0 = userPerspectivesDetailsHash.substring(32, 64);
    const result = this.api?.tx.identity.setIdentity({
      ...(this.identityInfo as any),
      additional: [
        [{ Raw: 'evees-cid1' }, { Raw: cid1 }],
        [{ Raw: 'evees-cid0' }, { Raw: cid0 }]
      ]
    });
    // TODO: Dont block here, cache value
    await new Promise(async (resolve, reject) => {
      const unsub = await result?.signAndSend(<AddressOrPair>this?.account, (result) => {
        if (result.status.isInBlock) {
        } else if (result.status.isFinalized) {
          unsub();
          resolve();
        }
      });
    });
  }

  public async signText(messageText) {
    const message = stringToU8a(messageText);
    const currentPair = keyring.getPairs()[0];
    return currentPair.sign(message);
  }
}
