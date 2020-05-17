import { EthereumContract } from '@uprtcl/ethereum-provider';
import { OwnerAccessControlService, OwnerPermissions } from '@uprtcl/access-control';

import { UPDATE_OWNER, GET_PERSP_HASH, GET_PERSP_OWNER, UPDATE_OWNER_BATCH } from './common';
import { ApolloClient } from 'apollo-boost';
import { inject, Container } from 'inversify';

import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { EveesHelpers } from '../../../graphql/helpers';
import { Evees } from 'src/services/evees';

export class EveesAccessControlEthereum implements OwnerAccessControlService {
  constructor(
    protected uprtclRoot: EthereumContract,
    protected container: Container) {}
  
  async changeOwner(ref: string, newOwnerId: string): Promise<void> {

    debugger

    /** TODO: there were two alternatives. 
     *  - (1) search desendants here , or 
     *  - (2) search descendants on the persmisions.owner lense.  
     * (1) seems correct as it seems correct that the authority decides the logic for permissions "inheritance", like is the case for HTTP API.
     */

    const client: ApolloClient<any> = this.container.get(ApolloClientModule.bindings.Client);
    const recognizer: PatternRecognizer = this.container.get(CortexModule.bindings.Recognizer);

    const currentAccessControl = await EveesHelpers.getAccessControl(client, ref);
    if (!currentAccessControl) throw new Error(`${ref} don't have access control`);

    const authority = await EveesHelpers.getPerspectiveAuthority(client, ref);
    if (!authority) throw new Error(`${ref} is not a perspective`);
    
    /** recursively search for children owned by this owner and change also those */
    const descendants = await EveesHelpers.getDescendants(client, recognizer, ref);
    
    /** filter the descendants witht he same owner and in the same authority */
    const getOwned = descendants.filter(async (descendant) => {
      const accessControl = await EveesHelpers.getAccessControl(client, descendant);
      if (!accessControl) return false;
      let entityType: string = recognizer.recognizeType(accessControl.permissions);
      if (entityType === 'OwnerPermissions' && accessControl.canWrite === currentAccessControl.canWrite) {
        const thisAuthority = await EveesHelpers.getPerspectiveAuthority(client, descendant);
        return thisAuthority === authority;
      };
    });

    const owned = await Promise.all(getOwned);

    const getPerspectivesIdsHashes = owned.map(async (id) => this.uprtclRoot.call(GET_PERSP_HASH, [id]));
    const perspectivesIdsHashes = await Promise.all(getPerspectivesIdsHashes);

    await this.uprtclRoot.send(UPDATE_OWNER_BATCH, [perspectivesIdsHashes, newOwnerId]);
  }

  async setCanWrite(ref: string, userId: string): Promise<void> {
    return this.changeOwner(ref, userId);
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
