import { LitElement, property, html, internalProperty, css } from 'lit-element';
import { servicesConnect } from '@uprtcl/evees-ui';
import { Entity, LinksType } from '@uprtcl/evees';
import { TextNode, TextType } from '../types';

export class DocumentPreviewCard extends servicesConnect(LitElement) {
  @property()
  uref!: string;

  @internalProperty()
  data!: Entity<TextNode>;

  @internalProperty()
  loading: boolean = true;

  @internalProperty()
  title!: string;

  @internalProperty()
  description!: string;

  firstUpdated() {
    this.load();
  }

  async load() {
    this.loading = true;

    this.data = await this.evees.getPerspectiveData(this.uref);
    this.title = this.evees.behaviorFirst(this.data.object, 'title');
    const children = this.evees.behaviorFirst(this.data.object, LinksType.children);
    if (children && children.length > 0) {
      const data = await this.evees.getPerspectiveData(children[0]);
      this.description = this.evees.behaviorFirst(data.object, 'title');
    }

    this.loading = false;
  }

  render() {
    if (this.loading) return '';

    switch (this.data.object.type) {
      case TextType.Title:
        return html`<div>
          <h3>${this.title}</h3>
          <p>${this.description}</p>
        </div>`;

      case TextType.Paragraph:
        return html`<div>
          <p>${this.title}</p>
          <p>${this.description}</p>
        </div>`;
    }
  }

  static get styles() {
    return css`
      h3 {
        font-size: 24px;
        font-weight: 600;
        letter-spacing: -0.02em;
        margin: 0rem 0rem 1rem 0rem;
      }

      p {
        margin: 0;
        font-size: 16px;
        color: #828282;
      }
    `;
  }
}
