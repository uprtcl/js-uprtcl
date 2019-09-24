import { DefaultHashedPattern } from './defaults/default-hashed.pattern';
import { DefaultSignedPattern } from './defaults/default-signed.pattern';
import { DefaultSecuredPattern } from './defaults/default-secured.pattern';

export function getDefaultPatterns() {
  const hashed = new DefaultHashedPattern();
  const signed = new DefaultSignedPattern();
  const secured = new DefaultSecuredPattern(hashed, signed);

  return { hashed, signed, secured };
}
