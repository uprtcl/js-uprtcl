import { LitElement, property, html, css, internalProperty, TemplateResult } from 'lit-element';

import {
  Perspective,
  PerspectiveDetails,
  Commit,
  Logger,
  ClientRemote,
  Entity,
  Signed,
} from '@uprtcl/evees';

import { servicesConnect } from 'src/uprtcl-evees-ui';

interface PerspectiveData {
  id?: string;
  perspective?: Perspective;
  details?: PerspectiveDetails;
  canUpdate?: Boolean;
  permissions?: any;
  head?: Entity<Commit>;
  data?: Entity;
}

/** An evees info base component, it starts from the first-uref */
export class EveesInfoDebugger extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'uref' })
  uref!: string;

  @internalProperty()
  loading!: boolean;

  protected remote!: ClientRemote;
  protected perspectiveData!: PerspectiveData;

  async firstUpdated() {
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.get('uref') !== undefined) {
      this.logger.info('updated() reload', { changedProperties });
      this.load();
    }
  }

  /** must be called from subclass as super.load() */
  async load() {
    this.logger.info('Loading evee perspective', this.uref);

    this.remote = await this.evees.getPerspectiveRemote(this.uref);

    const entity = await this.evees.getEntity(this.uref);
    if (!entity) throw Error(`Entity not found ${this.uref}`);

    this.loading = true;

    const { details } = await this.evees.getPerspective(this.uref);

    const head =
      details.headId !== undefined ? await this.evees.getEntity(details.headId) : undefined;
    const data =
      head !== undefined ? await this.evees.getEntity(head.object.payload.dataId) : undefined;

    this.perspectiveData = {
      id: this.uref,
      details,
      perspective: (entity.object as Signed<Perspective>).payload,
      head,
      data,
    };

    this.logger.info('load', { perspectiveData: this.perspectiveData });

    this.loading = false;
  }

  render() {
    if (!this.perspectiveData) return '';

    return html`
      <div class="perspective-details">
        <div class="prop-name"></div>
        <div class="prop-name">perspective id</div>
        <pre class="prop-value">${this.perspectiveData.id}</pre>

        <div class="prop-name">perspective</div>
        <pre class="prop-value">
${JSON.stringify(this.perspectiveData.perspective, undefined, 2)}</pre
        >

        <div class="prop-name">authority</div>
        <pre class="prop-value">
${this.perspectiveData.perspective
            ? `${this.perspectiveData.perspective.remote}:${this.perspectiveData.perspective.path}`
            : ''}</pre
        >
        <div class="prop-name">head</div>
        <pre class="prop-value">${JSON.stringify(this.perspectiveData.head, undefined, 2)}</pre>

        <div class="prop-name">data</div>
        <pre class="prop-value">${JSON.stringify(this.perspectiveData.data, undefined, 2)}</pre>
      </div>
    `;
  }

  static get styles() {
    return [
      css`
        :host {
          line-height: 1rem;
          font-family: monospace;
          user-select: text;
        }
        .perspective-details {
          padding: 5px;
          text-align: left;
          width: 400px;
          overflow: auto;
          height: 400px;
        }

        .prop-name {
          font-weight: bold;
          width: 100%;
        }

        .prop-value {
          font-family: Lucida Console, Monaco, monospace;
          font-size: 12px;
          text-align: left;
          background-color: #a0a3cb;
          color: #1c1d27;
          padding: 16px 16px;
          margin-bottom: 16px;
          border-radius: 6px;
          width: 100%;
          overflow: auto;
          width: calc(100% - 32px);
          overflow-x: auto;
        }
      `,
    ];
  }
}
