import { AccessControlState } from './access-control.reducer';
import { PatternRecognizer, Pattern } from '@uprtcl/cortex';
import { selectEntities, selectById } from '../../entities';
import { Updatable } from '../properties/updatable';
import { selectAuth, selectUplAuthInfo } from '../../auth/state/auth.selectors';
import { Permissions } from '../properties/permissions';

export const accessControlReducerName = 'access-control';

export const selectAccessControl = (state: any): AccessControlState =>
  state[accessControlReducerName];

export const selectEntityAccessControl = (id: string) => (state: AccessControlState) =>
  state.accessControl[id];

export const selectCanWrite = (recognizer: PatternRecognizer) => (entityId: string) => (
  state: any
) => {
  const entity = selectById(entityId)(selectEntities(state));
  if (!entity) return false;

  const updatable: Updatable<any, any> | undefined = recognizer.recognizeUniqueProperty(
    entity,
    prop => !!prop.origin
  );

  if (!updatable) return false;

  const auth = selectUplAuthInfo(updatable.origin(entity))(selectAuth(state));

  const permissions = selectEntityAccessControl(entityId)(selectAccessControl(state));

  if (!permissions) return true;

  const accessControlPattern: Permissions<any> | undefined = recognizer.recognizeUniqueProperty(
    permissions,
    prop => !!prop.canWrite
  );

  if (!accessControlPattern) return false;

  return accessControlPattern.canWrite(permissions)(auth);
};
