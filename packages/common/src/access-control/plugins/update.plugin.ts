import { Store } from 'redux';

import { Plugin, CortexEntityBase, LensElement } from '@uprtcl/cortex';
import { Constructor, ReduxTypes } from '@uprtcl/micro-orchestrator';

import { loadAccessControl } from '../state/access-control.actions';
import { PropertyValues } from 'lit-element';
import {
  accessControlReducerName,
  selectAccessControl,
  selectEntityAccessControl
} from '../state/access-control.selectors';
import { Updatable } from '../properties/updatable';

export const updatePlugin = <T extends CortexEntityBase>(): Plugin<T> => (
  baseElement: Constructor<CortexEntityBase>
): Constructor<CortexEntityBase> =>
  class extends baseElement {
    entityEditable: boolean = false;

    connectedCallback() {
      super.connectedCallback();

      this.addEventListener('content-changed', ((e: CustomEvent) => {
        e.stopPropagation();
        this.updateContent(e.detail.newContent);
      }) as EventListener);
    }

    update(changedProperties: PropertyValues) {
      super.update(changedProperties);

      const renderer = this.getLensElement();
      if (renderer) {
        const lensElement = (renderer as unknown) as LensElement<any>;

        lensElement.editable = this.entityEditable;
      }
    }

    async loadEntity(hash: string) {
      const entity = await super.loadEntity(hash);

      const store: Store = this.request(ReduxTypes.Store);

      store.subscribe(() => {
        const state = store.getState();

        this.entityEditable = selectEntityAccessControl(this.hash)(
          selectAccessControl(state)
        ).writable;
      });
      await store.dispatch(loadAccessControl(this.patternRecognizer)(this.hash, entity) as any);

      return entity;
    }

    async updateContent(newContent: any) {
      const updatable: Updatable = this.patternRecognizer.recognizeMerge(this.entity);

      if (updatable.update) {
        this.selectedLens = undefined;
        const reloadNeeded = await updatable.update(this.entity, newContent);

        if (reloadNeeded) await this.entityUpdated();
      }
    }
  };
