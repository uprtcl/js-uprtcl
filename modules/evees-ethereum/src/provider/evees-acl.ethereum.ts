import { html } from 'lit-element';

import { EthereumContract } from '@uprtcl/ethereum-provider';
import { AccessControlService } from '@uprtcl/evees';
import { Lens } from '@uprtcl/lenses';

import { GET_PERSP_HASH, GET_PERSP_OWNER } from './common';

export class EveesAccessControlEthereum implements AccessControlService {

  constructor(protected uprtclRoot: EthereumContract) {
  }

  async getOwner(perspectiveId: string) {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [
      perspectiveId,
    ]);

    const owner = await this.uprtclRoot.call(GET_PERSP_OWNER, [
      perspectiveIdHash,
    ]);
    return owner.toLowerCase();
  }

  async canWrite(uref: string, userId: string) {
    return userId === await this.getOwner(uref);
  }

  lense(): Lens {
    return {
        name: 'evees-ethereum:access-control',
        type: 'access-control',
        render: (uref: string) => {
          return html`
            <evees-ethereum-permissions uref=${uref}>
            </evees-ethereum-permissions>
          `;
        },
      };
  };

}
