import { PropertyValues } from 'lit-element';

import { Constructor, ReduxConnectedElement } from '@uprtcl/micro-orchestrator';

import { Updatable, selectCanWrite } from '@uprtcl/common';
import { CortexEntityBase } from '../elements/cortex-entity-base';
import { LensesPlugin } from './lenses-plugin';
import { LensElement } from '../types';
import { Pattern, CreateChild } from '@uprtcl/cortex';

export const updatePlugin = <
  T extends CortexEntityBase & ReduxConnectedElement
>(): LensesPlugin<T> => (
  baseElement: Constructor<CortexEntityBase & ReduxConnectedElement>
): Constructor<CortexEntityBase & ReduxConnectedElement> =>
  class extends baseElement {
    entityEditable: boolean = false;

    connectedCallback() {
      super.connectedCallback();

      this.addEventListener('content-changed', ((e: CustomEvent) => {
        e.stopPropagation();
        this.updateContent(e.detail.newContent);
      }) as EventListener);

      this.addEventListener('create-child', ((e: CustomEvent) => {
        e.stopPropagation();
        this.createChild(e.detail.parent);
      }) as EventListener);
    }

    async createChild(parent: any) {
      if (!this.entity) return;

      const patterns: Pattern | CreateChild = this.patternRecognizer.recognizeMerge(this.entity);
      const updateNeeded = await (patterns as CreateChild).createChild(this.entity, parent);

      if (updateNeeded) this.entityUpdated();
    }

    stateChanged(state: any) {
      super.stateChanged(state);

      this.entityEditable = selectCanWrite(this.patternRecognizer)(this.hash)(state);
    }

    update(changedProperties: PropertyValues) {
      super.update(changedProperties);

      const renderer = this.getLensElement();
      if (renderer) {
        const lensElement = (renderer as unknown) as LensElement<any>;

        lensElement.editable = this.entityEditable;
      }
    }

    async updateContent(newContent: any) {
      if (!this.entity) return;

      const updatable: Updatable = this.patternRecognizer.recognizeMerge(this.entity);

      if (updatable.update) {
        const reloadNeeded = await updatable.update(this.entity, newContent);
        if (reloadNeeded) this.entityUpdated();
      }
    }
  };
