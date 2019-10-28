import { Store } from 'redux';

import { Plugin, Updatable, CortexEntityBase } from '@uprtcl/cortex';
import { Constructor, ReduxTypes } from '@uprtcl/micro-orchestrator';

import { loadAccessControl } from '../state/access-control.actions';

export const updatePlugin = <T extends CortexEntityBase>(): Plugin<T> => (
  baseElement: Constructor<CortexEntityBase>
): Constructor<CortexEntityBase> =>
  class extends baseElement {
    connectedCallback() {
      super.connectedCallback();

      this.addEventListener('content-changed', ((e: CustomEvent) => {
        e.stopPropagation();
        this.updateContent(e.detail.newContent);
      }) as EventListener);
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
