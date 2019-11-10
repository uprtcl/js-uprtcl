import { html, fixture, expect } from '@open-wc/testing';

import '../dist/uprtcl-common.js';

describe('<uprtcl-common>', () => {
  it('has a default property title', async () => {
    const el = await fixture('<uprtcl-common></uprtcl-common>');

    expect(el.title).to.equal('Hello world!');
  });

  it('allows property title to be overwritten', async () => {
    const el = await fixture(html`
      <uprtcl-common title="different title"></uprtcl-common>
    `);

    expect(el.title).to.equal('different title');
  });
});
