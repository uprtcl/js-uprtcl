import { html, TemplateResult } from 'lit-element';

import { CortexEntityBase } from './cortex-entity-base';
import { sharedStyles } from '../shared-styles';

export class CortexEntity extends CortexEntityBase {
  static get styles() {
    return sharedStyles;
  }

  forwardSlots():TemplateResult[] {
    let slots:TemplateResult[] = [];

    for (const el of this.children) {
      const slotName = el.getAttribute('slot');
      if (slotName) {
        slots.push(html`<slot name=${slotName} slot=${slotName}></slot>`);
      }
    }

    return slots;
  }

  renderSlotPlugins() {
    return html`
      ${this.forwardSlots()}
      <div slot="plugins" class="row center-content">
        ${Object.keys(this.slotPlugins).map(
          key => this.entity && this.slotPlugins[key].renderSlot(this.entity)
        )}
      </div>
      ${Object.keys(this.slotPlugins).map(
        key =>
          this.entity &&
          html`
            <div slot=${key}>${this.slotPlugins[key].renderSlot(this.entity)}</div>
          `
      )}
    `;
  }

  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    if (!this.selectedLens) return html``;

    return this.selectedLens.render(this.renderSlotPlugins(), this.context);
  }

  render() {
    return html`
      ${!this.selectedLens
        ? html`
            <cortex-loading-placeholder></cortex-loading-placeholder>
          `
        : html`
            ${this.renderLens()}
          `}
    `;
  }
}
