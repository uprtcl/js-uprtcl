import { AccessControl } from "@uprtcl/evees";

export interface AccessControlWithUi extends AccessControl {
  lense?(): Lens;
}

