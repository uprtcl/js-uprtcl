import { LitElement, html, css, property } from 'lit-element';
import { EveesModule } from '@uprtcl/evees';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { router } from '../router';

export class AccountSpace extends moduleConnect(LitElement) {
  @property({ type: Object }) location = router.location;
  private officialRemote;

  async firstUpdated() {
    // this.loading = true;

    const defaultRemote = (this.request(EveesModule.bindings.Config) as any).defaultRemote;
    await defaultRemote.ready();

    // this.defaultRemoteId = defaultRemote.id;
    //
    // this.officialRemote = this.requestAll(EveesModule.bindings.EveesRemote).find(instance =>
    //   instance.id.includes(env.officialRemote)
    // );
    //
    // // wait all remotes to be ready
    // await Promise.all(
    //   this.requestAll(EveesModule.bindings.EveesRemote).map(remote => remote.ready())
    // );
    //
    // this.canCreate = await this.officialRemote.isLogged();
    //
    // if (window.location.href.includes('?id=')) {
    //   this.rootHash = window.location.href.split('id=')[1];
    // }
    //

    // TODO: this is how to get around proposal error
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
    //   const perspective = await deriveSecured(remoteHome, this.officalRemote.store.cidConfig);
    //   await this.officalRemote.store.create(perspective.object);
    //
    //   window.history.pushState('', '', `/?id=${perspective.id}`);
    // }
    //
    // this.loading = false;
  }

  render() {
    return html`
      <div>Council space</div>
      <wiki-drawer uref=${this.location.params.accountId} default-remote=${''}></wiki-drawer>
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      text-align: center;
      //height: 80vh;
      //padding: 10vh 10px;
    }
  `;
}
