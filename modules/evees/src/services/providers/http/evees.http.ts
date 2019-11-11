import { HttpConnection } from "@uprtcl/connections";
import { Logger } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { BasicAdminAccessControlService } from '@uprtcl/common';

import { ProposalProvider } from "../../proposal.provider";
import { EveesRemote } from "../../evees.remote";
import { PerspectiveDetails } from "../../../types";

export class EveesHttp implements EveesRemote {
    
  evees_api: string = 'uprtcl-v1';
  connection!: HttpConnection;
  logger = new Logger('HTTP-EVEES-PROVIDER');
  accessControl: BasicAdminAccessControlService | undefined;
  proposals: ProposalProvider | undefined;

  constructor (protected host: string, jwt: string) {
    this.connection = new HttpConnection(host, jwt, {});
  }
  
  async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    const object = await this.connection.get<any>(`/get/${hash}`);
    return {
      id: hash,
      object: object
    }
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  get name() : string {
    return `http:${this.evees_api}:+${this.host}`;
  } 

  configure(sourceName: string): boolean {
    throw new Error("Method not implemented.");
  }

  async clonePerspective(perspective: any): Promise<void> {
    await this.connection.post('/persp', perspective);
  }

  async cloneCommit(commit: any): Promise<void> {
    await this.connection.post('/commit', commit);
  }

  async updatePerspectiveDetails(perspectiveId: string, details: Partial<PerspectiveDetails>): Promise<void> {
    await this.connection.put(`/persp/${perspectiveId}/details`, details);
  }

  getContextPerspectives(context: string): Promise<any[]> {
    return this.connection.get(`/persp?context=${context}`);
  }

  getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    return this.connection.get(`/persp/${perspectiveId}/details`);
  }

}