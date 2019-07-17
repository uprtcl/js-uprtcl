import PatternRegistry from '../../src/patterns/registry/pattern.registry';
import { HashedPattern } from '../../src/patterns/derive/hashed.pattern';

/**
 * Pattern registry test
 */
describe('Pattern registry test', () => {
  let patternRegistry: PatternRegistry;

  beforeEach(() => {
    patternRegistry = new PatternRegistry();
  });

  it('register default patterns', async () => {
    const hashedPattern = new HashedPattern();
    patternRegistry.registerPattern('hashed', hashedPattern);

    const object = { id: '', object: {} };
    const pattern: HashedPattern = patternRegistry.from(object) as HashedPattern;
    pattern.validate(object);
  });
});
