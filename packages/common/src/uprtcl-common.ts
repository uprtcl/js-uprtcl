// Required by inversify
import 'reflect-metadata';

/** Types */
export { EntitiesTypes, AccessControlTypes } from './types';

/** Auth */
export { authReduxModule } from './auth/state';
export { AuthAction, UpdateUplAuth, UPDATE_UPL_AUTH } from './auth/state/auth.actions';
export { authReducerName, selectAuth, selectUplAuthInfo } from './auth/state/auth.selectors';

/** Access Control */
export { Updatable } from './access-control/properties/updatable';

export { AccessControlService } from './access-control/services/access-control.service';
export {
  OwnerAccessControl,
  OwnerAccessControlService
} from './access-control/services/owner-access-control.service';
export { accessControlReduxModule } from './access-control/state';
export {
  selectEntityAccessControl,
  selectAccessControl
} from './access-control/state/access-control.selectors';
export {
  AccessControlAction,
  LoadAccessControlSuccess,
  LOAD_ACCESS_CONTROL,
  LOAD_ACCESS_CONTROL_SUCCESS,
  LoadAccessControl
} from './access-control/state/access-control.actions';
export {
  loadAccessControlSaga,
  loadAccessControlOnEntityLoadSaga
} from './access-control/state/access-control.sagas';

/** Drafts */
export { draftsModule } from './draft/draft.module';
export { DraftsService } from './draft/services/drafts.service';
export { DraftsHolochain } from './draft/services/drafts.holochain';
export { DraftsLocal } from './draft/services/drafts.local';

// Default patterns
export { CidHashedPattern, recognizeHashed } from './patterns/cid-hashed.pattern';
export { DefaultSignedPattern } from './patterns/default-signed.pattern';
export { DefaultSecuredPattern, Secured } from './patterns/default-secured.pattern';

/** Entities */
export {
  LOAD_ENTITY,
  LOAD_ENTITY_SUCCESS,
  LoadEntity,
  LoadEntitySuccess,
  entitiesReducer,
  EntityActions,
  EntitiesState,
  selectById,
  selectAll,
  selectByPattern,
  selectEntities,
  entitiesReducerName,
  entitiesReduxModule
} from './entities';

/** Utils */
export { sortObject } from './utils/utils';
