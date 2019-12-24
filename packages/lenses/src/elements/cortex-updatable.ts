import { LitElement, property, PropertyValues, html } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, CreateChild, Hashed, CortexTypes } from '@uprtcl/cortex';
import { Updatable, GraphQlTypes } from '@uprtcl/common';
import { ApolloClient, gql } from 'apollo-boost';

export class CortexUpdatable extends moduleConnect(LitElement) {
  @property({ type: Object })
  entity!: Hashed<any>;

  @property({ type: Boolean })
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

    const recognizer: PatternRecognizer = this.request(CortexTypes.Recognizer);

    const createChild: CreateChild | undefined = recognizer.recognizeUniqueProperty(
      this.entity,
      prop => !!(prop as CreateChild).createChild
    );

    if (createChild) {
      const updateNeeded = await createChild.createChild(this.entity)(parent);

      if (updateNeeded) this.fireEntityUpdated();
    }
  }

  firstUpdated() {
    this.loadAccessControl();
  }

  async loadAccessControl() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);

    const result = await client.query({
      query: gql`
        {
          getEntity(id: "${this.entity.id}") {
            entity {
              patterns {
                accessControl {
                  canWrite
                }
              }
            }
          }
        }
      `
    });

    if (result.data.getEntity.entity.patterns.accessControl) {
      this.entityEditable = result.data.getEntity.entity.patterns.accessControl.canWrite;
    } else {
      this.entityEditable = true;
    }
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (!this.shadowRoot) return;

    const slot: HTMLSlotElement | null = this.shadowRoot.querySelector('slot');
    if (!slot) return;

    let lensElement: Element | undefined = undefined;
    for (const node of slot.assignedNodes()) {
      if ((node as HTMLElement).id === 'lens-element') {
        lensElement = node as HTMLElement;
      } else if ((node as HTMLElement).querySelector) {
        const element = (node as HTMLElement).querySelector('#lens-element');
        if (element) lensElement = element;
      }
    }

    if (lensElement) {
      ((lensElement.firstElementChild as unknown) as {
        editable: boolean;
      }).editable = this.entityEditable;
    }
  }

  async updateContent(newContent: any) {
    if (!this.entity) return;

    const recognizer: PatternRecognizer = this.request(CortexTypes.Recognizer);
    const updatable: Updatable<any, any> | undefined = recognizer.recognizeUniqueProperty(
      this.entity,
      prop => !!(prop as Updatable<any, any>).update
    );

    if (updatable) {
      const reloadNeeded = await updatable.update(this.entity)(newContent);
      if (reloadNeeded) this.fireEntityUpdated();
    }
  }

  fireEntityUpdated() {
    this.dispatchEvent(new CustomEvent('entity-updated'));
  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}
