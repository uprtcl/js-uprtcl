import { EveesMutation } from '../interfaces/types';
export interface Proposal {
  id: string;
  creatorId?: string;
  timestamp?: number;
  toPerspectiveId: string;
  fromPerspectiveId?: string;
  toHeadId?: string;
  fromHeadId?: string;
  mutation: EveesMutation;
}
