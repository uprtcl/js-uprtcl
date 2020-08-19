// import { injectable } from 'inversify';

// import {
//   EntryResult,
//   HolochainProvider,
//   parseEntriesResults,
// } from '@uprtcl/holochain-provider';
// import { Signed, Entity } from '@uprtcl/cortex';
// import {
//   KnownSourcesService,
//   defaultCidConfig,
//   CASStore,
// } from '@uprtcl/multiplatform';

// import {
//   Perspective,
//   Commit,
//   PerspectiveDetails,
//   NewPerspectiveData,
// } from '../../../types';
// import { EveesRemote } from '../../evees.remote';
// import { Secured } from '../../../utils/cid-hash';
// import { parseResponse } from '@uprtcl/holochain-provider';

// @injectable()
// export abstract class EveesHolochain extends HolochainProvider
//   implements EveesRemote {
//   store!: CASStore;
//   knownSources?: KnownSourcesService | undefined;
//   userId?: string | undefined;
//   zome: string = 'evees';

//   id: string = '';
//   defaultPath: string = '';

//   get accessControl() {
//     return undefined;
//   }

//   get proposals() {
//     return undefined;
//   }

//   get casID() {
//     // TODO RETURN SOURCE ID
//     return 'undefined';
//   }

//   get cidConfig() {
//     return defaultCidConfig;
//   }

//   /**
//    * @override
//    */
//   public async ready() {
//     await super.ready();
//   }

//   /**
//    * @override
//    */
//   async updatePerspective(
//     perspectiveId: string,
//     details: PerspectiveDetails
//   ): Promise<void> {
//     await this.call('update_perspective_details', {
//       perspective_address: perspectiveId,
//       details: details,
//     });
//   }

//   /**
//    * @override
//    */
//   async getContextPerspectives(context: string): Promise<string[]> {
//     const perspectivesResponse = await this.call('get_context_perspectives', {
//       context: context,
//     });

//     const perspectivesEntries: EntryResult<
//       Signed<Perspective>
//     >[] = parseEntriesResults(perspectivesResponse);
//     return perspectivesEntries.filter((p) => !!p).map((p) => p.entry.id);
//   }

//   /**
//    * @override
//    */
//   async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
//     const result = await this.call('get_perspective_details', {
//       perspective_address: perspectiveId,
//     });
//     return parseResponse(result);
//   }

//   async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
//     await this.call('clone_perspective', {
//       previous_address: perspectiveData.perspective.id,
//       perspective: perspectiveData.perspective.object,
//     });
//     return this.updatePerspective(
//       perspectiveData.perspective.id,
//       perspectiveData.details
//     );
//     // TODO: addEditor
//   }

//   async createPerspectiveBatch(
//     newPerspectivesData: NewPerspectiveData[]
//   ): Promise<void> {
//     const promises = newPerspectivesData.map((perspectiveData) =>
//       this.createPerspective(perspectiveData)
//     );
//     await Promise.all(promises);
//   }

//   deletePerspective(perspectiveId: string): Promise<void> {
//     throw new Error('Method not implemented.');
//   }
// }
