import { Pattern } from '../pattern';
import { RenderPattern } from '../patterns/render.pattern';

export class DefaultRenderPattern implements Pattern, RenderPattern<any> {
  recognize() {
    return true;
  }

  render = (object: object) => Promise.resolve(object);
}
