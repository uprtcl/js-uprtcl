import { LitElement, property, html, css, query } from 'lit-element';
import * as Box from '3box';
import { blockies } from './blockies.js';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { styleMap } from './evees-info-popper.js';

export class EveesAuthor extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-AUTHOR');

  @property({ type: String, attribute: 'user-id' })
  userId!: string;

  @property({ type: String })
  color!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  profile: any = {};

  @property({ attribute: false })
  image: any | undefined = undefined;

  @query('#blockie-canvas')
  blockie!: HTMLElement;

  async firstUpdated() {
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('userId')) {
      this.load();
    }
  }

  async load() {
    this.profile.userId = this.userId;
    this.requestUpdate();
    await this.updateComplete;

    if (this.blockie != null) {
      blockies.render(
        {
          seed: this.profile.userId,
          size: 8,
          scale: 4,
        },
        this.blockie
      );
    }

    this.profile = await Box.getProfile(this.userId);
    this.profile.userId = this.userId;
    this.image = this.profile.image
      ? `https://ipfs.io/ipfs/${this.profile.image[0].contentUrl['/']}`
      : undefined;

    this.requestUpdate();
  }

  clicked() {
    if (this.profile.url) {
      window.location = this.profile.url;
    }
  }

  render() {
    this.logger.log('render()', this.profile);

    if (this.profile.userId === undefined) return '';

    return html`
      <div class="boxAddress boxAddressFull">
        <div
          class="boxImg"
          style="${styleMap({
            borderColor: this.color,
          })}"
        >
          ${this.image !== undefined
            ? html`<img src=${this.image} />`
            : html`<canvas id="blockie-canvas"></canvas> `}
          }
        </div>

        <div class="boxShortAddress">
          ${this.profile.name ? this.profile.name : this.profile.userId}
        </div>
      </div>
    `;
  }

  static get styles() {
    const baseTileHeight = css`28px`;
    return css`
      .boxAddress {
        background: transparent;
        height: fit-content;
        padding: 0px;
        font-family: Arial, sans-serif;
        position: relative;
        width: fit-content;
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }

      .boxAddress .boxImg {
        background: rgb(7, 73, 136);
        height: ${baseTileHeight};
        width: ${baseTileHeight};
        border-radius: 50%;
        overflow: hidden;
        border-style: solid;
        border-width: 2px;
      }

      .boxAddress .boxImg img {
        height: 100%;
        width: 100%;
        object-fit: cover;
        background-color: white;
      }

      .boxShortAddress {
        color: rgb(99, 102, 104);
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.015em;
        display: block;
        padding: 0 16px;
        max-width: 200px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    `;
  }
}
