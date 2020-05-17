import { EthereumContract } from '@uprtcl/ethereum-provider';
import { OwnerAccessControlService, OwnerPermissions } from '@uprtcl/access-control';

import { UPDATE_OWNER, GET_PERSP_HASH, GET_PERSP_OWNER } from './common';
import { ApolloClient } from 'apollo-boost';
import { inject } from 'inversify';

import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { EveesHelpers } from '../../../graphql/helpers';

export class EveesAccessControlEthereum implements OwnerAccessControlService {
  constructor(
    protected uprtclRoot: EthereumContract,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>) {}
  
  async changeOwner(refs: string[], newOwnerId: string): Promise<void> {

    const currentAccessControl = await EveesHelpers.getAccessControl(this.client, this.entityId);
    
    /** recursively search for children owned by this owner and change also those */
    const descendants = await EveesHelpers.getDescendants(this.client, this.recognizer, this.entityId);
    
    /** filter the descendants witht he same owner */
    const getOwned = descendants.filter(async (ref) => {
      const accessControl = await EveesHelpers.getAccessControl(this.client, ref);
      if (!accessControl) return false;
      let entityType: string = this.recognizer.recognizeType(accessControl.permissions);
      return entityType === 'OwnerPermissions' && accessControl.canWrite === currentAccessControl.canWrite;
    });

    const owned = await Promise.all(getOwned);

    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [hash]);

    await this.uprtclRoot.send(UPDATE_OWNER_BATCH, [owned, newOwnerId]);
  }

  async setCanWrite(refs: string[], userId: string): Promise<void> {
    return this.changeOwner(refs, userId);
  }

  private async getOwner(hash: string): Promise<string> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [hash]);

    const owner = await this.uprtclRoot.call(GET_PERSP_OWNER, [perspectiveIdHash]);
    return owner.toLowerCase();
  }

  async getPermissions(hash: string): Promise<OwnerPermissions | undefined> {
    let owner = await this.getOwner(hash);
    return { owner };
  }

  setPermissions(hash: string, newPersmissions: OwnerPermissions): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
