import { Signed } from 'src/patterns/interfaces/signable';
import { Secured } from '../cas/utils/cid-hash';
import { Evees } from '../evees/evees.service';
import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { Perspective } from '../evees/interfaces/types';

/** a services that builds tree of perspectives that is apended to
 * the home space of the logged user. This services creates this
 * tree of perspectives and offers methods to navigate it */
export interface AppElement {
  path: string;
  getInitData: (children?: AppElement[]) => any;
  perspective?: Secured<Perspective>;
  children?: AppElement[];
}
/** the relative (to home) path of each app element */
export class AppElements {
  readonly remote: RemoteEvees;

  constructor(protected evees: Evees, protected home: AppElement, remoteId?: string) {
    this.remote = this.evees.getRemote(remoteId);
  }

  async check(): Promise<void> {
    if (!this.remote.getHome) throw new Error(`Remote don't have a home default`);

    /** home space perspective is deterministic */
    this.home.perspective = await this.remote.getHome();
    await this.checkOrCreatePerspective(this.home.perspective);

    /** all other objects are obtained relative to the home perspective */
    await this.getOrCreateElementData(this.home);
  }

  /** Returns the appElement from the path */
  getElement(path: string): AppElement {
    let thisElement = this.home;

    let childElements = thisElement.children;
    const nextPath = path.split('/').slice(1);

    while (nextPath.length > 0 && nextPath[0] !== '') {
      if (!childElements)
        throw new Error(`AppElement ${JSON.stringify(thisElement)} don't have children`);
      const thisPath = nextPath.shift();
      const childFound = childElements.find((e) => {
        const path = e.path.split('/')[1];
        return path === thisPath;
      });
      if (!childFound) {
        throw new Error('Element not found at path');
      }
      thisElement = childFound;
      childElements = thisElement.children;
    }

    return thisElement;
  }

  async get(path): Promise<Secured<Perspective>> {
    const element = await this.getElement(path);

    if (!element) throw new Error(`element not found at path ${path}`);
    if (!element.perspective) throw new Error(`perspective not found at path ${path}`);

    return element.perspective;
  }

  async createSnapElementRec(element: AppElement) {
    element.perspective = await this.remote.snapPerspective({});

    /** make sure the perspective is in the store to be resolved */
    await this.evees.client.store.storeEntity({
      object: element.perspective.object,
      remote: element.perspective.object.payload.remote,
    });

    if (element.children) {
      await Promise.all(element.children.map((child) => this.createSnapElementRec(child)));
    }
  }

  async initPerspectiveDataRec(element: AppElement, parentId?: string) {
    const data = element.getInitData(element.children);

    if (!element.perspective)
      throw new Error(`perspective not found for element ${JSON.stringify(element)}`);

    const perspective = element.perspective;

    await this.evees.createEvee({
      object: data,
      partialPerspective: perspective.object.payload,
      parentId,
    });

    if (element.children) {
      await Promise.all(
        element.children.map((child) => this.initPerspectiveDataRec(child, perspective.id))
      );
    }
  }

  // make sure a perspective exist, or creates it
  async checkOrCreatePerspective(perspective: Secured<Perspective>) {
    /** make sure the perspective is in the store to be resolved */
    await this.evees.client.store.storeEntity({
      object: perspective.object,
      remote: perspective.object.payload.remote,
    });

    /** get the perspective data */
    const { details } = await this.evees.client.getPerspective(perspective.id);

    /** canUpdate is used as the flag to detect if the home space exists */
    if (!details.canUpdate) {
      /** create the home perspective as it did not existed */
      const id = await this.evees.createEvee({
        partialPerspective: perspective.object.payload,
      });
    }
  }

  async getOrCreateElementData(element: AppElement) {
    if (!element.perspective)
      throw new Error(`perspective not found for element ${JSON.stringify(element)}`);

    const data = await this.evees.tryGetPerspectiveData(element.perspective.id);
    if (!data) {
      await this.initTree(element);
    } else {
      await this.readTree(element);
    }
  }

  async initTree(element: AppElement) {
    // Create perspectives from top to bottom
    if (element.children) {
      // snap all perspectives (compute their ids)
      await Promise.all(element.children.map((child) => this.createSnapElementRec(child)));

      if (!element.perspective) throw new Error('Element perspective not defined');
      const elementId = element.perspective.id;
    }

    // set perspectives data
    await this.initPerspectiveDataRec(element);

    await this.evees.client.flush();
  }

  async readTree(element: AppElement) {
    /** gets the element data from its perspective,
     * then visits it's children recursively filling the
     * tree perspective properties*/

    if (!element.perspective)
      throw new Error(`Element ${JSON.stringify(element)} doest not have the perspective set`);

    const data = await this.evees.getPerspectiveData(element.perspective.id);

    /** if the scheleton does not have children, then stop reading the tree here */
    if (!element.children) {
      return;
    }

    /** a one to one mapping from data children to element children is assumed */
    const dataChildren = this.evees.behavior(data.object, 'getChildrenLinks');
    await Promise.all(
      element.children.map(async (child, ix) => {
        const childId = dataChildren[ix];
        const perspective = await this.evees.client.store.getEntity<Signed<Perspective>>(childId);

        /** set the perspective of the child */
        child.perspective = perspective;

        /** recursively call the readTree */
        await this.readTree(child);
      })
    );
  }
}
