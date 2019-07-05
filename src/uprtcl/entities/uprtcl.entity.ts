import { ContentAddressableEntity } from '../../entity/content-addressable.entity';


export class UprtclEntity<T extends object> extends ContentAddressableEntity<T> {

  

  constructor(object: T, options: any) {
    super(object, options);
  }
}