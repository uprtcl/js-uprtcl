import { DefaultRenderPattern } from '../defaults/default-render.pattern';
import { DefaultHashedPattern } from '../defaults/default-hashed.pattern';
import { DefaultSignedPattern } from '../defaults/default-signed.pattern';
import { DefaultSecuredPattern } from '../defaults/default-secured.pattern';

const signed = new DefaultSignedPattern();
const hashed = new DefaultHashedPattern();

export const defaultPatterns = {
  render: new DefaultRenderPattern(),
  hashed: hashed,
  signed: signed,
  secured: new DefaultSecuredPattern(hashed, signed)
};
