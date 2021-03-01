import EventEmitter from 'events';
import { CASStore } from '../../cas/interfaces/cas-store';
import { Client, ClientEvents } from '../interfaces/client';
import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';
import {
  GetPerspectiveOptions,
  NewPerspective,
  Update,
  EveesMutation,
  EveesMutationCreate,
  PerspectiveGetResult,
} from '../interfaces/types';
import { Proposals } from '../proposals/proposals';
import { BaseRouter } from './base.router';
import { ProposalsRouter } from './proposals.router';
import { SearchEngineRouter } from './search.router';

export class RemoteRouter extends BaseRouter implements Client {
  proposals?: Proposals | undefined;
  searchEngine!: SearchEngine;
  events: EventEmitter;

  constructor(protected remotes: RemoteEvees[], public store: CASStore) {
    super(remotes, store);
    this.searchEngine = new SearchEngineRouter(remotes, store);
    this.proposals = new ProposalsRouter(remotes, store);
    this.events = new EventEmitter();

    /** forward events */

    this.remotes.forEach((remote) => {
      if (remote.events) {
        remote.events.on(ClientEvents.updated, (perspectiveIds) =>
          this.events.emit(ClientEvents.updated, perspectiveIds)
        );
      }
    });
  }

  getRemote(remoteId: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`Remote not found for ${remoteId}`);
    return remote;
  }

  async newPerspective(newPerspective: NewPerspective) {
    throw new Error('Method not implemented.');
  }
  async deletePerspective(perspectiveId: string) {
    throw new Error('Method not implemented.');
  }
  async updatePerspective(update: Update) {
    throw new Error('Method not implemented.');
  }

  async getPerspective(
    perspectiveId: string,
    options: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.getPerspective(perspectiveId, options);
  }

  async diff(): Promise<EveesMutation> {
    return {
      deletedPerspectives: [],
      newPerspectives: [],
      updates: [],
    };
  }

  async canUpdate(perspectiveId: string, userId?: string) {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.canUpdate(perspectiveId, userId);
  }

  async update(mutation: EveesMutationCreate) {
    const mutationPerRemote = await this.splitMutation(mutation);
    /** at this point the mutation is split per remote and is sent to each remote */
    await Promise.all(
      Array.from(mutationPerRemote.keys()).map((remoteId) => {
        const mutation = mutationPerRemote.get(remoteId) as EveesMutation;
        const remote = this.getRemote(remoteId);
        return remote.update(mutation);
      })
    );
  }

  async flush() {}

  async refresh() {}

  /** get all user perspectives on all registered remotes */
  async getUserPerspectives(perspectiveId: string) {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.getUserPerspectives(perspectiveId);
      })
    );
    return Array.prototype.concat.apply([], all);
  }
}
