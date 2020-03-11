import { injectable } from 'inversify';
import { html, TemplateResult } from 'lit-html';

import { Pattern } from '@uprtcl/cortex';

import { HasLenses } from '../../src/properties/has-lenses';

@injectable()
export class MockPattern implements Pattern, HasLenses {
  recognize() {
    return true;
  }

  name = 'Mock';

  lenses = (entity: any) => [
    {
      name: 'content',
      render: (lensContent: TemplateResult, context: any) =>
        html`
          <mock-element .content=${entity.object.test}></mock-element>
        `
    }
  ];
}
