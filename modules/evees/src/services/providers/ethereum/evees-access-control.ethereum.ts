import { EthereumContract } from '@uprtcl/ethereum-provider';
import {
  OwnerAccessControlService,
  OwnerPermissions,
} from '@uprtcl/access-control';

import {
  UPDATE_OWNER,
  GET_PERSP_HASH,
  GET_PERSP_OWNER,
  UPDATE_OWNER_BATCH,
} from './common';
import { ApolloClient } from 'apollo-boost';
import { inject, Container } from 'inversify';

import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { EveesHelpers } from '../../../graphql/helpers';
import { EveesModule } from '../../../evees.module';
import { loadEntity } from '@uprtcl/multiplatform';

export class EveesAccessControlEthereum implements OwnerAccessControlService {
  constructor(
    protected uprtclRoot: EthereumContract,
    protected container: Container
  ) {}

  async changeOwner(uref: string, newOwnerId: string): Promise<void> {
    /** TODO: there were two alternatives.
     *  - (1) search desendants here , or
     *  - (2) search descendants on the persmisions.owner lense.
     * (1) seems correct as it seems correct that the remote decides the logic for permissions "inheritance", like is the case for HTTP API.
     */

    const client: ApolloClient<any> = this.container.get(
      ApolloClientModule.bindings.Client
    );
    const recognizer: PatternRecognizer = this.container.get(
      CortexModule.bindings.Recognizer
    );

    const currentAccessControl = await EveesHelpers.getAccessControl(
      client,
      uref
    );
    if (!currentAccessControl)
      throw new Error(`${uref} don't have access control`);

    const remote = await EveesHelpers.getPerspectiveRemoteId(client, uref);
    if (!remote) throw new Error(`${uref} is not a perspective`);

    /** recursively search for children owned by this owner and change also those */
    const descendants = await EveesHelpers.getDescendants(
      client,
      recognizer,
      uref
    );

    /** filter the descendants witht he same owner and in the same remote */
    const asyncFilter = async (arr, predicate) =>
      Promise.all(arr.map(predicate)).then((results) =>
        arr.filter((_v, index) => results[index])
      );

    const owned = await asyncFilter(descendants, async (descendantRef) => {
      let descendant = await loadEntity<any>(client, descendantRef);
      if (!descendant) throw new Error('descendant not found');

      let descendantType: string = recognizer.recognizeType(descendant);
      if (descendantType !== EveesModule.bindings.PerspectiveType) return false;

      const accessControl = await EveesHelpers.getAccessControl(
        client,
        descendantRef
      );
      if (!accessControl) return false;

      let entityType: string = recognizer.recognizeType(
        accessControl.permissions
      );

      if (
        entityType === 'OwnerPermissions' &&
        accessControl.permissions.owner ===
          currentAccessControl.permissions.owner
      ) {
        const thisRemoteId = await EveesHelpers.getPerspectiveRemoteId(
          client,
          descendantRef
        );
        return thisRemoteId === remote;
      }
    });

    const all = [uref].concat(owned);
    const getPerspectivesIdsHashes = all.map(async (id) =>
      this.uprtclRoot.call(GET_PERSP_HASH, [id])
    );
    const perspectivesIdsHashes = await Promise.all(getPerspectivesIdsHashes);

    await this.uprtclRoot.send(UPDATE_OWNER_BATCH, [
      perspectivesIdsHashes,
      newOwnerId,
    ]);
  }

  async setCanWrite(uref: string, userId: string): Promise<void> {
    return this.changeOwner(uref, userId);
  }

  private async getOwner(hash: string): Promise<string> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [
      hash,
    ]);

    const owner = await this.uprtclRoot.call(GET_PERSP_OWNER, [
      perspectiveIdHash,
    ]);
    return owner.toLowerCase();
  }

  async getPermissions(hash: string): Promise<OwnerPermissions | undefined> {
    let owner = await this.getOwner(hash);
    return { owner };
  }

  setPermissions(
    hash: string,
    newPersmissions: OwnerPermissions
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
