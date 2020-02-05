import { injectable, inject } from 'inversify';

import { CortexModule, PatternRecognizer, HasChildren } from '@uprtcl/cortex';
import { DiscoveryModule, DiscoveryService, KnownSourcesService, Authority } from '@uprtcl/multiplatform';
import { Permissions, SET_CAN_WRITE } from '@uprtcl/access-control';


import { UpdateRequest, RemotesConfig } from '../types';
import { EveesBindings } from '../bindings';
import { ApolloClientModule } from '@uprtcl/graphql';
import { ApolloClient } from 'apollo-boost';
import { Evees, RecursiveContextMergeStrategy, CREATE_PERSPECTIVE } from '../uprtcl-evees';

@injectable()
export class OwnerPreservingMergeStrategy extends RecursiveContextMergeStrategy {

  constructor (
    @inject(EveesBindings.RemotesConfig) protected remotesConfig: RemotesConfig,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(DiscoveryModule.bindings.LocalKnownSources) protected knownSources: KnownSourcesService,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>) {
    super(remotesConfig, evees, discovery, knownSources, recognizer, client);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    targetCanWrite: string,
    targetAuthority: string
  ): Promise<UpdateRequest[]> {
    
    super.mergePerspectives(toPerspectiveId, fromPerspectiveId);

    /** review  */
    const forceOwnerPromises = this.updatesList.map(async (updateRequest) => {
      
      let oldLinks: string[] = [];
      
      if (updateRequest.oldHeadId) {
        const oldData = await this.loadCommitData(updateRequest.newHeadId);
        let oldHasChildren: HasChildren | undefined = this.recognizer
          .recognize(oldData)
          .find(prop => !!(prop as HasChildren).getChildrenLinks);

        if (!oldHasChildren) {
          oldLinks = [];
        } else {
          oldLinks = oldHasChildren.getChildrenLinks(oldData);
        }
      }

      let newLinks: string[] = [];
      
      const newData = await this.loadCommitData(updateRequest.newHeadId);
      let newHasChildren: HasChildren | undefined = this.recognizer
        .recognize(newData)
        .find(prop => !!(prop as HasChildren).getChildrenLinks);

      if (!newHasChildren) {
        newLinks = [];
      } else {
        newLinks = newHasChildren.getChildrenLinks(newData);
      }

      /** check for each newLink that was not an old link if the authority and canWrite are the
       * target, if not, create a global perspective on the targetAuthority wher targetCanWrite canWrite
       */
      
      newLinks.forEach(async (newLink) => {
        if (!oldLinks.includes(newLink)) {

          /** TODO: instead of using getPerspectiveProviderById, get access control
           * from pattern te generalize to not-to-perspective links */
          const remote = await this.evees.getPerspectiveProviderById(newLink);
          const permissions = await remote.accessControl.getPermissions(newLink);

          const permissionsPattern: Permissions<any> | undefined = this.recognizer
            .recognize(permissions)
            .find(prop => !!(prop as Permissions<any>).canWrite);

          if (!permissionsPattern) return null;

          const userId = remote.userId;
          const canWrite = permissionsPattern.canWrite(permissions)(userId);

          if (!canWrite) {
            const details = await remote.getPerspectiveDetails(newLink);
            
            /** create a global perspective of the link and set as the bew link */
            const perspectiveMutation = await this.client.mutate({
              mutation: CREATE_PERSPECTIVE,
              variables: {
                headId: details.headId,
                context: details.context,
                authority: targetAuthority,
                canWrite: targetCanWrite,
                recursive: true
              }
            });

          }
        }
      }) 
    })
    
    return this.updatesList;
  }

}
