import { storiesOf, html, withKnobs, withClassPropertiesKnobs } from '@open-wc/demoing-storybook';

import { UprtclCommon } from '../dist/UprtclCommon.js';
import '../dist/uprtcl-common.js';

storiesOf('uprtcl-common', module)
  .addDecorator(withKnobs)
  .add('Documentation', () => withClassPropertiesKnobs(UprtclCommon))
  .add(
    'Alternative Title',
    () => html`
      <uprtcl-common .title=${'Something else'}></uprtcl-common>
    `,
  );
