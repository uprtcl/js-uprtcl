import { Store } from 'redux';

import { Plugin, Updatable, CortexEntityBase, LensElement } from '@uprtcl/cortex';
import { Constructor, ReduxTypes } from '@uprtcl/micro-orchestrator';

import { loadAccessControl } from '../state/access-control.actions';
import { PropertyValues } from 'lit-element';

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

      const updatable: Updatable = this.patternRecognizer.recognizeMerge(entity);

      if (updatable.canUpdate) {
        this.entityEditable = await updatable.canUpdate(entity);
      }
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
