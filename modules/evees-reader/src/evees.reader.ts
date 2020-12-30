import { Commit, EveesRemote, Perspective, Secured } from '@uprtcl/evees';
import { CASStore } from '@uprtcl/multiplatform';
import { Entity, PatternRecognizer, HasChildren } from '@uprtcl/cortex';

export interface EveeData {
  perspective: Secured<Perspective>;
  commit: Secured<Commit> | undefined;
  Data: Entity<any> | undefined;
}

export class EveesReader {
  constructor(
    protected remotes: EveesRemote[],
    protected store: CASStore,
    protected recognizer: PatternRecognizer
  ) {}

  async resolve(uref: string, recurse = false) {
    const perspectiveObject = (await this.store.get(uref)) as any | undefined;
    if (!perspectiveObject) throw new Error(`Perspective payload not found ${uref}`);

    const remote = this.remotes.find((r) => r.id === perspectiveObject.payload.remote);
    if (!remote) throw new Error(`Remote ${perspectiveObject.payload.remote}`);
    const details = await remote.getPerspective(uref);
    const commitObject =
      details && details.headId ? ((await this.store.get(details.headId)) as any) : undefined;
    const dataId = commitObject.payload.dataId;
    const data =
      commitObject && commitObject.payload.dataId ? await this.store.get(dataId) : undefined;

    let dataCleaned = data;

    if (recurse) {
      /** git children from pattern */
      const dataEntity = { id: dataId, object: data };
      const hasChildren: HasChildren = this.recognizer
        .recognizeBehaviours(dataEntity)
        .find((b) => (b as HasChildren).getChildrenLinks);

      const children = hasChildren.getChildrenLinks(dataEntity);
      const childrenData = await Promise.all(children.map((child) => this.resolve(child)));

      const dataEntityWithChildren = hasChildren.replaceChildrenLinks(dataEntity)(
        childrenData as any
      );
      dataCleaned = dataEntityWithChildren.object;
    }

    return dataCleaned;
  }
}
