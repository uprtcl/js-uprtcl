import { UplAuth } from '@uprtcl/cortex';

export const UPDATE_UPL_AUTH = '[AUTH] UPDATE_UPL_AUTH';

export interface UpdateUplAuth {
  type: typeof UPDATE_UPL_AUTH;
  payload: {
    upl: string;
    uplAuth: UplAuth;
  };
}

export type AuthAction = UpdateUplAuth;
