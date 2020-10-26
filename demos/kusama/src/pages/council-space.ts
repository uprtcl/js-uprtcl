import { LitElement, html, css, property, query } from 'lit-element';
import { EveesModule, EveesHelpers, deriveSecured, hashObject } from '@uprtcl/evees';
import { router } from '../router';
// import { env } from '../env';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class CouncilSpace extends moduleConnect(LitElement) {
  // @property({ type: Object, attribute: 'location' })
  // location!: Object;
  @property({ type: Object }) location = router.location;

  private defaultRemoteId: string;
  private officialRemote;
  private canCreate: boolean = false;

  async firstUpdated() {
    const defaultRemote = (this.request(EveesModule.bindings.Config) as any).defaultRemote;
    await defaultRemote.ready();
    this.defaultRemoteId = defaultRemote.id;

    this.officialRemote = this.requestAll(EveesModule.bindings.EveesRemote).find((instance: any) =>
      instance.id.includes('council')
    );

    // wait all remotes to be ready
    await Promise.all(
      this.requestAll(EveesModule.bindings.EveesRemote).map((remote: any) => remote.ready())
    );

    this.canCreate = await this.officialRemote.isLogged();
    // this.loading = true;
    // if (window.location.href.includes('remoteHome=')) {
    //   const randint = 0 + Math.floor((10000 - 0) * Math.random());
    //   const context = await hashObject({
    //     creatorId: '',
    //     timestamp: randint
    //   });
    //
    //   const remoteHome = {
    //     remote: this.officialRemote.id,
    //     path: '',
    //     creatorId: '',
    //     timestamp: 0,
    //     context: context
    //   };
    //
    //   const perspective = await deriveSecured(remoteHome, this.officialRemote.store.cidConfig);
    //   await this.officialRemote.store.create(perspective.object);
    //
    //   window.history.pushState('', '', `/?id=${perspective.id}`);
    // }
    // this.loading = false;
  }

  render() {
    return html`
      <div>Council space</div>
      <wiki-drawer uref=${''} default-remote=${this.defaultRemoteId}></wiki-drawer>
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      text-align: center;
      height: 80vh;
      padding: 10vh 10px;
    }
  `;
}
