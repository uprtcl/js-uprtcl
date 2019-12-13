import { RenderLensPlugin } from '../render-lens.plugin';
import { html, TemplateResult } from 'lit-element';
import { Hashed } from '@uprtcl/cortex';

export class UpdatablePlugin implements RenderLensPlugin {
  renderLens(lens: TemplateResult, entity: Hashed<any>) {
    return html`
      <cortex-updatable .entity=${entity}>${lens}</cortex-updatable>
    `;
  }
}
