import { Signed } from '../patterns/interfaces/signable';
import { Logger } from '../utils/logger';
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
  optional?: boolean;
  perspective?: Secured<Perspective>;
  children?: AppElement[];
}
/** the relative (to home) path of each app element */
export class AppElements {
  readonly remote: RemoteEvees;
  logger = new Logger('AppElements');

  constructor(protected evees: Evees, protected home: AppElement, remoteId?: string) {
    this.remote = this.evees.getRemote(remoteId);
  }

  async check(): Promise<void> {
    this.logger.log('check()');
    /** home space perspective is deterministic */
    this.home.perspective = await this.evees.getHome(this.remote.id);
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

  async createSnapElementRec(element: AppElement, level: number = 0, biasTime: number = 0) {
    element.perspective = await this.remote.snapPerspective({
      timestamp: Date.now() + level * 10000 + biasTime,
    });

    /** make sure the perspective is in the store to be resolved */
    await this.evees.client.store.storeEntity({
      object: element.perspective.object,
      remote: element.perspective.object.payload.remote,
    });

    if (element.children) {
      await Promise.all(
        element.children.map((child, ix) => this.createSnapElementRec(child, level + ix))
      );
    }
  }

  async initPerspectiveDataRec(element: AppElement, guardianId?: string) {
    const data = element.getInitData(element.children);

    if (!element.perspective)
      throw new Error(`perspective not found for element ${JSON.stringify(element)}`);

    const perspective = element.perspective;

    await this.evees.createEvee({
      object: data,
      partialPerspective: perspective.object.payload,
      guardianId,
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
      this.logger.log('create perspective data()', perspective.object.payload);
      const id = await this.evees.createEvee({
        partialPerspective: perspective.object.payload,
      });
    }
  }

  async getOrCreateElementData(element: AppElement) {
    if (!element.perspective)
      throw new Error(`perspective not found for element ${JSON.stringify(element)}`);

    const data = await this.evees.tryGetPerspectiveData(element.perspective.id);
    this.logger.log('getOrCreateElementData()', { element, data });

    if (!data) {
      await this.initTree(element);
    } else {
      await this.readTree(element);
    }
  }

  async initTree(element: AppElement) {
    this.logger.log('initTree()', { element });

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

    this.logger.log('readTree()', { element });

    if (!element.perspective)
      throw new Error(`Element ${JSON.stringify(element)} doest not have the perspective set`);

    const data = await this.evees.getPerspectiveData(element.perspective.id);

    /** if the scheleton does not have children, then stop reading the tree here */
    if (!element.children) {
      return;
    }

    /** a one to one mapping from data children to element children is assumed */
    const dataChildren = this.evees.behaviorConcat(data.object, 'children');
    await Promise.all(
      element.children.map(async (child, ix) => {
        const childId = dataChildren[ix];
        const perspective = await this.evees.client.store.getEntity<Signed<Perspective>>(childId);

        if (!perspective) {
          /** if perspective does not exist maybe the user removed part of the scheleton */
          if (child.optional !== true) {
            throw new Error(`Perspective not found for expected element ${child}`);
          }
          return;
        }
        /** set the perspective of the child */
        child.perspective = perspective;

        /** recursively call the readTree */
        await this.readTree(child);
      })
    );
  }
}
