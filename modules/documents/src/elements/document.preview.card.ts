import { LitElement, property, html, internalProperty } from 'lit-element';
import { servicesConnect } from '@uprtcl/evees-ui';

export class DocumentPreviewCard extends servicesConnect(LitElement) {
  @property()
  uref!: string;

  @internalProperty()
  title!: string;

  firstUpdated() {
    this.load();
  }

  async load() {
    const data = await this.evees.getPerspectiveData(this.uref);
    this.title = this.evees.behaviorFirst(data.object, 'title');
  }

  render() {
    return html`${this.title}`;
  }
}
