import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { CASStore, Logger, NewPerspectiveData, RemoteEvees, UpdateRequest } from '@uprtcl/evees';
import {
  PerspectiveGetResult,
  EveesMutationCreate,
  EveesMutation,
} from '@uprtcl/evees/dist/types/evees/interfaces/client';
import { SearchEngine } from '@uprtcl/evees/dist/types/evees/interfaces/search.engine';

import { HttpProvider, HttpProviderOptions } from './http.provider';

export const loginMessage = (nonce: string) => {
  return `Login to Intercreativiy \n\nnonce:${nonce}`;
};

export class HttpEthAuthProvider extends HttpProvider implements RemoteEvees {
  logger = new Logger('HTTP-ETH-Provider');

  account: string | undefined = undefined;

  constructor(public pOptions: HttpProviderOptions, protected ethConnection: EthereumConnection) {
    super(pOptions);
  }

  store!: CASStore;
  searchEngine!: SearchEngine;

  getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    throw new Error('Method not implemented.');
  }
  update(mutation: EveesMutationCreate) {
    throw new Error('Method not implemented.');
  }
  newPerspective(newPerspective: NewPerspectiveData) {
    throw new Error('Method not implemented.');
  }
  deletePerspective(perspectiveId: string) {
    throw new Error('Method not implemented.');
  }
  updatePerspective(update: UpdateRequest) {
    throw new Error('Method not implemented.');
  }
  diff(): Promise<EveesMutation> {
    throw new Error('Method not implemented.');
  }
  flush(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refresh(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  canUpdate(perspectiveId: string, userId?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async connect() {
    await this.ethConnection.ready();

    /** keep a copy of the current ethConnection account */
    this.account = this.ethConnection.getCurrentAccount();

    const currentUserId = this.userId;

    if (currentUserId !== undefined) {
      if (currentUserId !== this.account) {
        await this.logout();
      }
    }

    /** chech if HTTP authToken is available */
    const currentToken = super.authToken;

    if (currentToken !== undefined) {
      try {
        /** if there is a token, check if the token is valid */
        const isAuthorized = await this.isLogged();
        if (!isAuthorized) this.logout();
      } catch (e) {
        super.authToken = undefined;
      }
    }
  }

  async isLogged() {
    if (this.userId === undefined) return false;
    return super.getObject<boolean>(`/user/isAuthorized`);
  }

  async getNonce() {
    if (this.account === undefined) throw Error('account undefined');
    return super.getObject<string>(`/user/${this.account}/nonce`);
  }

  async authorize(signature: string) {
    if (this.account === undefined) throw Error('account undefined');
    return super.getWithPut<{ jwt: string }>(`/user/${this.account}/authorize`, { signature });
  }

  async logout(): Promise<void> {
    super.userId = undefined;
    super.authToken = undefined;
  }

  async login(): Promise<void> {
    if (!this.ethConnection.canSign()) {
      await this.ethConnection.connectWallet();
      await this.connect();
    }

    if (this.account === undefined || this.account === '') throw Error('account undefined');

    const nonce = await this.getNonce();
    const signature = await this.ethConnection.signText(loginMessage(nonce), this.account);
    const token = await this.authorize(signature);

    super.userId = this.account;
    super.authToken = 'Bearer ' + token.jwt;
  }
  async isConnected(): Promise<boolean> {
    return true;
  }
  async disconnect(): Promise<void> {}
}
