import { LitElement, property, PropertyValues, html } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, CreateChild, Hashed, CortexTypes } from '@uprtcl/cortex';
import { Updatable } from '@uprtcl/common';

export class CortexUpdatable extends moduleConnect(LitElement) {
  @property()
  entity!: Hashed<any>;

  @property()
  entityEditable: boolean = true;

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

  loadAccessControl() {}

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (this.shadowRoot) {
      const lensElement = this.shadowRoot.getRootNode().firstChild;
      console.log('lenseleemnet', lensElement);
      ((lensElement as unknown) as { editable: boolean }).editable = this.entityEditable;
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
