import { SecuredEntity } from '../../entity.1/entities/secured.entity';

export class UprtclEntity<T extends object> extends SecuredEntity<T> {
  constructor(options: any) {
    super(options);
  }
}
