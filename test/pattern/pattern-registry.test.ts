import PatternRegistry from '../../src/patterns/registry/pattern.registry';
import { DefaultHashedPattern } from '../../src/patterns/defaults/default-hashed.pattern';
import { HashedPattern } from '../../src/patterns/patterns/hashed.pattern';

/**
 * Pattern registry test
 */
describe('Pattern registry test', () => {
  let patternRegistry: PatternRegistry;

  beforeEach(() => {
    patternRegistry = new PatternRegistry();
  });

  it('register default patterns', async () => {
    const object = { id: '0', object: {} };
    const pattern: HashedPattern<any> = patternRegistry.from(object);
    console.log(pattern);
    pattern.validate(object);
  });
});
