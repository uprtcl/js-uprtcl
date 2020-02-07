import { injectable, inject } from 'inversify';
import { ApolloClient } from 'apollo-boost';

import { CortexModule, PatternRecognizer, HasChildren, Hashed } from '@uprtcl/cortex';
import { DiscoveryModule, DiscoveryService, KnownSourcesService, Authority } from '@uprtcl/multiplatform';
import { Permissions } from '@uprtcl/access-control';
import { ApolloClientModule } from '@uprtcl/graphql';

import { UpdateRequest, RemotesConfig } from '../types';
import { EveesBindings } from '../bindings';
import { RecursiveContextMergeStrategy } from './recursive-context.merge-strategy';
import { CREATE_PERSPECTIVE } from '../graphql/queries';
import { Evees } from '../services/evees';

export interface OwnerPreservinConfig {
  targetCanWrite: string,
  targetAuthority: string
} 

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
    config: OwnerPreservinConfig    
  ): Promise<UpdateRequest[]> {
    
    await super.mergePerspectives(toPerspectiveId, fromPerspectiveId);

    /** review all updates and craete new globnal perspective if target authority and 
     * canWrite are not as exected. This keeps the target perspective under control of one
     * owner and authority */

    if (!config || !config.targetAuthority || !config.targetCanWrite) {
      throw new Error('config {targetAuthority: string, targetCanWrite: string} should be provided');
    }

    const targetAuthority = config.targetAuthority;
    const targetCanWrite = config.targetCanWrite;

    const forceOwnerPromises = this.updatesList.map(async (updateRequest): Promise<UpdateRequest> => {
      
      let oldLinks: string[] = [];
      
      if (updateRequest.oldHeadId) {
        const oldData = await this.loadCommitData(updateRequest.oldHeadId);
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
      
      const newNewLinksPromises = newLinks.map(async (newLink): Promise<string> => {
        if (!oldLinks.includes(newLink)) {
          let fork = false;
          
          /** TODO: instead of using getPerspectiveProviderById, get access control
           * from pattern te generalize to not-to-perspective links */
          const remote = await this.evees.getPerspectiveProviderById(newLink);

          if (remote.authority !== targetAuthority) {
            /** if different remote, then fork */
            fork = true;
          } else {
            // if same remote then check canWrite too
            const permissions = await remote.accessControl.getPermissions(newLink);

            const permissionsPattern: Permissions<any> | undefined = this.recognizer
              .recognize(permissions)
              .find(prop => !!(prop as Permissions<any>).canWrite);
  
            if (!permissionsPattern) throw new Error('Target remote cant hanle canWrite');
  
            const userId = remote.userId;
            const canWrite = permissionsPattern.canWrite(permissions)(userId);
  
            if (!canWrite) {
              fork = true;
            } 
          }

          if (fork) {
            const details = await remote.getPerspectiveDetails(newLink);
            
            /** create a global perspective of the link and set as the bew link */
            const perspectiveMutation = await this.client.mutate({
              mutation: CREATE_PERSPECTIVE,
              variables: {
                headId: details.headId,
                context: details.context,
                name: `from${details.name ? ('-' + details.name) : ''}`,
                authority: targetAuthority,
                canWrite: targetCanWrite,
                recursive: true
              }
            });

            return perspectiveMutation.data.createPerspective.id;
          }

          /** if fork false, simple return the same link */
          return newLink;
        } else {
          return newLink;
        }
      }) 

      const newNewLinks = await Promise.all(newNewLinksPromises);

      const sameLinks = newNewLinks.length === newLinks.length && newNewLinks.every((value, index) => value === newLinks[index]);
      if(!sameLinks) {
        /** create a new data and commit with the new links and upadte perspective head */
        if (!newHasChildren) throw new Error('Target data dont have children, cant update its links');

        const newNewData = (newHasChildren.replaceChildrenLinks(newData)(newNewLinks) as Hashed<any>);
        const newUpdateRequest = await this.updatePerspectiveData(updateRequest.perspectiveId, newNewData.object);

        return newUpdateRequest;
      } else {
        return updateRequest;
      }
    })

    const newUpdatesList = await Promise.all(forceOwnerPromises);
    
    return newUpdatesList
  }

}
