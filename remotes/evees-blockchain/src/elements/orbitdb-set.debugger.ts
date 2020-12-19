import { LitElement, html, css, internalProperty, query, property } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { Logger } from '@uprtcl/micro-orchestrator';

import { EveesModule, EveesRemote, Perspective, Secured } from '@uprtcl/evees';
import { Signed } from '@uprtcl/cortex';
import { EveesOrbitDBEntities } from '@uprtcl/evees-orbitdb';

import { EveesBlockchainCached } from '../provider/evees.blockchain.cached';

interface PerspectiveDetails {
  address: string;
  isPinned: boolean;
  headLocal: string | undefined;
  headPinner: string | undefined;
  otherPerspectives: string[];
}

interface EntityDetails {
  hash: string;
  dataLocal: any;
  dataPinner: any;
}

export class EveesOrbitDBDebugger extends moduleConnect(LitElement) {
  logger = new Logger('Debug Component');

  @property({ type: Boolean, attribute: 'show-contexts' })
  showDeleteContexts: boolean = false;

  @internalProperty()
  reading: boolean = false;

  @internalProperty()
  readingEntity: boolean = false;

  @internalProperty()
  loading: boolean = true;

  @internalProperty()
  perspective!: Secured<Perspective>;

  @internalProperty()
  details!: PerspectiveDetails;

  @internalProperty()
  entityDetails!: EntityDetails;

  @query('#perspective-input')
  perspectiveInputEl!: any;

  @query('#entity-input')
  entityInputEl!: any;

  protected remotes!: EveesRemote[];
  protected remote!: EveesBlockchainCached;

  async firstUpdated() {
    this.remotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.load();
  }

  async load() {
    this.loading = true;
    const remote = this.remotes.find((r) => r.id.includes('fixed'));
    if (!remote) {
      throw new Error(`remote not found`);
    }
    this.remote = remote as EveesBlockchainCached;
    this.loading = false;
  }

  async read() {
    this.reading = true;
    this.perspectiveInputEl.value;

    const object = (await this.remote.store.get(
      this.perspectiveInputEl.value
    )) as Signed<Perspective>;

    this.perspective = {
      id: this.perspectiveInputEl.value,
      object,
    };

    const otherPerspectives = await this.remote.getContextPerspectives(
      this.perspective.object.payload.context
    );

    const remote = this.remotes.find((r) => r.id === this.perspective.object.payload.remote);
    if (!remote) {
      throw new Error(`remote not found`);
    }
    const details = await remote.getPerspective(this.perspective.id);

    const store = await this.remote.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Perspective,
      this.perspective,
      false
    );

    if (!this.remote.orbitdbcustom.pinner) throw new Error('pinner not defined');

    const isPinned = await this.remote.orbitdbcustom.pinner.isPinned(store.address);

    let detailsPinner;
    if (isPinned) {
      detailsPinner = await this.remote.orbitdbcustom.pinner.getAll(store.address);
    }

    this.details = {
      address: store.address,
      isPinned,
      headLocal: details.headId,
      headPinner: detailsPinner ? detailsPinner.headId : undefined,
      otherPerspectives,
    };

    this.reading = false;
  }

  async readEntity() {
    this.readingEntity = true;
    const hash = this.entityInputEl.value;

    let object;

    try {
      object = await this.remote.store.get(hash);
    } catch (e) {
      //
    }

    if (!this.remote.orbitdbcustom.pinner) throw new Error('pinner not defined');
    const objectPinner = await this.remote.orbitdbcustom.pinner.getEntity(hash);

    this.entityDetails = {
      hash,
      dataLocal: object,
      dataPinner: objectPinner,
    };

    this.readingEntity = false;
  }

  async delete(id: string) {
    const contextStore = await this.remote.orbitdbcustom.getStore(EveesOrbitDBEntities.Context, {
      context: this.perspective.object.payload.context,
    });

    this.logger.info(`contextStore.delete(${id})`);
    await contextStore.delete(id);

    this.read();
  }

  debugPerspective() {
    return html`
      <div class="row">
        <uprtcl-textfield id="perspective-input" label="perspective id"></uprtcl-textfield>
        <uprtcl-button-loading @click=${() => this.read()} ?loading=${this.reading}>
          read
        </uprtcl-button-loading>
      </div>
      ${this.details
        ? html` <div class="perspective">
              <pre>${JSON.stringify(this.details, null, 2)}</pre>
            </div>
            ${this.showDeleteContexts
              ? html`<div class="context-perspectives">
                  <b>Context: ${this.perspective.object.payload.context}</b>
                  <uprtcl-list>
                    ${this.details.otherPerspectives.map(
                      (id) => html` <uprtcl-list-item
                        >${id}<uprtcl-icon-button
                          @click=${() => this.delete(id)}
                          icon="clear"
                        ></uprtcl-icon-button
                      ></uprtcl-list-item>`
                    )}
                  </uprtcl-list>
                </div>`
              : ''}`
        : ''}
    `;
  }

  debugEntity() {
    return html`
      <div class="row">
        <uprtcl-textfield id="entity-input" label="hash"></uprtcl-textfield>
        <uprtcl-button-loading @click=${() => this.readEntity()} ?loading=${this.readingEntity}>
          read
        </uprtcl-button-loading>
      </div>
      ${this.entityDetails
        ? html` <div class="perspective">
            <pre>${JSON.stringify(this.entityDetails, null, 2)}</pre>
          </div>`
        : ''}
    `;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    return html`<div class="row">
      <div class="column">${this.debugPerspective()}</div>
      <div class="column">${this.debugEntity()}</div>
    </div>`;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }
    pre {
      text-align: left;
      color: white;
      background-color: #434a4e;
      padding: 16px;
      border-radius: 6px;
    }
    .row {
      display: flex;
      width: 100%;
      align-items: center;
    }
    uprtcl-button-loading {
      margin-left: 12px;
    }
    .context-perspectives {
      margin-top: 32px;
    }
    uprtcl-list-item {
      font-family: 'Lucida Console', Monaco, monospace;
    }
    uprtcl-list {
      margin: 16px 0px;
      display: block;
      border: solid 1px;
    }
  `;
}
