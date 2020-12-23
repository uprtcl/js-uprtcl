import { Commit, EveesRemote, Perspective, Secured } from "@uprtcl/evees";
import { CASStore } from "@uprtcl/multiplatform";
import { Entity } from "@uprtcl/cortex";

export interface EveeData {
  perspective: Secured<Perspective>;
  commit: Secured<Commit> | undefined;
  Data: Entity<any> | undefined;
}

export class EveesReader {
  constructor(protected remotes: EveesRemote[], protected store: CASStore) {}

  async resolve(uref: string) {
    const perspectiveObject = (await this.store.get(uref)) as any | undefined;
    if (!perspectiveObject)
      throw new Error(`Perspective payload not found ${uref}`);

    const remote = this.remotes.find(
      (r) => r.id === perspectiveObject.payload.remote
    );
    if (!remote) throw new Error(`Remote ${perspectiveObject.payload.remote}`);
    const details = await remote.getPerspective(uref);
    const commitObject =
      details && details.headId
        ? ((await this.store.get(details.headId)) as any)
        : undefined;
    const data =
      commitObject && commitObject.payload.dataId
        ? await this.store.get(commitObject.payload.dataId)
        : undefined;

    return {
      perspective: {
        id: uref,
        object: perspectiveObject,
      },
      commit: commitObject
        ? { id: details.headId, object: commitObject }
        : undefined,
      data: data
        ? { id: commitObject.payload.dataId, object: data }
        : undefined,
    };
  }
}
