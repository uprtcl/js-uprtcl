export type KeypressAtArgs = {
  path: number[];
  keyCode: number;
  tail: string;
};
export const KEYPRESS_AT_TAG = 'keypress-at';

export class KeypressAtEvent extends CustomEvent<KeypressAtArgs> {
  constructor(init: CustomEventInit<KeypressAtArgs>) {
    super(KEYPRESS_AT_TAG, init);
  }
}
