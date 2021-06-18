import { LitElement, property, html, internalProperty, css } from 'lit-element';
import { servicesConnect } from '@uprtcl/evees-ui';
import { Entity } from '@uprtcl/evees';
import { TextNode, TextType } from '../types';

export class DocumentPreviewCard extends servicesConnect(LitElement) {
  @property()
  uref!: string;

  @internalProperty()
  title!: string;

  @internalProperty()
  data!: Entity<TextNode>;

  @internalProperty()
  loading: boolean = true;

  firstUpdated() {
    this.load();
  }

  async load() {
    this.loading = true;
    this.data = await this.evees.getPerspectiveData(this.uref);
    this.title = this.evees.behaviorFirst(this.data.object, 'title');
    this.loading = false;
  }

  render() {
    if (this.loading) return '';

    const classes = this.data.object.type === TextType.Title ? 'title' : 'paragraph';
    return html`<div class=${classes}>${this.title}</div>`;
  }

  static get styles() {
    return css`
      .title {
        font-size: 24px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .paragraph {
        font-size: 16px;
        font-weight: bold;
      }
    `;
  }
}
