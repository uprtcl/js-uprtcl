import { LitElement, property, html } from 'lit-element';
import { servicesConnect } from '@uprtcl/evees-ui';

export class DocumentPreviewCard extends servicesConnect(LitElement) {
  @property()
  uref!: string;

  render() {
    return html`${this.uref}`;
  }
}
