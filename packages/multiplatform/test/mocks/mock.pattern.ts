import { Pattern } from '@uprtcl/cortex';
import { injectable } from 'inversify';

@injectable()
export class MockPattern implements Pattern {
  recognize() {
    console.log('asdfasfdsdf');
    return true;
  }

  name = 'Mock';
}
