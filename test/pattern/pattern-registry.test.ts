import PatternRegistry from '../../src/patterns/registry/pattern.registry';
import { DefaultHashedPattern } from '../../src/patterns/defaults/default-hashed.pattern';
import { HashedPattern } from '../../src/patterns/patterns/hashed.pattern';
import { equal } from 'assert';

/**
 * Pattern registry test
 */
describe('Pattern registry test', () => {
  let patternRegistry: PatternRegistry;

  beforeEach(() => {
    patternRegistry = new PatternRegistry();
  });

  it('register default patterns', async () => {
    expect(patternRegistry.patternList.length).toBe(4);
  });

  it('recognize hashed default pattern', async () => {
    const object = { id: '0', object: {} };
    const pattern: HashedPattern<any> = patternRegistry.from(object);

    expect(pattern.validate(object)).toBeTruthy();
  });

  it("don't recognize hashed default pattern", async () => {
    const object = { object: {} };
    const pattern: HashedPattern<any> = patternRegistry.from(object);

    expect(pattern.hasOwnProperty('validate')).toBeFalsy();
  });

  it('get pattern from registry', async () => {
    const pattern: HashedPattern<any> = patternRegistry.getPattern('hashed');
    expect(pattern['validate']).toBeTruthy();
  });
});
