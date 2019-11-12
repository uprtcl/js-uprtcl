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

  const pattern: Pattern | Updatable = recognizer.recognizeMerge(entity);
  const origin = (pattern as Updatable).origin;

  if (!origin) return false;

  const auth = selectUplAuthInfo(origin(entity))(selectAuth(state));

  const permissions = selectEntityAccessControl(entityId)(selectAccessControl(state));

  if (!permissions) return true;

  const accessControlPattern: Pattern | Permissions = recognizer.recognizeMerge(permissions);
  const canWrite = (accessControlPattern as Permissions).canWrite;

  if (!canWrite) return false;

  return canWrite(permissions, auth);
};
