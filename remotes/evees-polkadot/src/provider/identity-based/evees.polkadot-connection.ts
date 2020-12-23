import { html } from 'lit-element';

import { BlockchainConnection } from '@uprtcl/evees-blockchain';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PolkadotConnection } from '../../connection.polkadot';
import { icons } from '../icons';

const EVEES_KEYS = ['evees-cid1', 'evees-cid0'];

export class EveesPolkadotConnection implements BlockchainConnection {
  logger: Logger = new Logger('EveesPolkadot');

  constructor(public connection: PolkadotConnection) {}

  async ready() {
    await Promise.all([this.connection.ready()]);
  }

  async updateHead(head: string | undefined) {
    await this.connection.updateMutableHead(head, EVEES_KEYS);
  }

  getHead(userId: string, block?: number) {
    return this.connection.getMutableHead(userId, EVEES_KEYS, block);
  }

  get account() {
    return this.connection.account;
  }
  getNetworkId() {
    return `polkadot-${this.connection.getNetworkId()}`;
  }
  icon() {
    let name = '';
    let iconName = '';
    switch (this.connection.getNetworkId()) {
      case 'Development':
        name = 'dev';
        iconName = 'kusama';
        break;

      case 'Kusama':
        name = 'Kusama';
        iconName = 'kusama';
    }
    return html`
      <div
        style="display:flex;align-items: center;color: #636668;font-weight:bold"
      >
        <div
          style="height: 32px;width: 32px;margin-right: 6px;border-radius:16px;overflow:hidden;"
        >
          ${icons[iconName]}
        </div>
        ${name} Identity
      </div>
    `;
  }
  avatar(userId: string, config: any = { showName: true }) {
    return html`<polkadot-account
      account=${userId}
      ?show-name=${config.showName}
    >
    </polkadot-account> `;
  }
  async getLatestBlock() {
    return this.connection.getLatestBlock();
  }
  async canSign() {
    return this.connection.canSign();
  }
  async connectWallet() {
    return this.connection.connectWallet();
  }
  async disconnectWallet() {
    return this.connection.disconnectWallet();
  }
}
