import CID from 'cids';
import multihashing from 'multihashing-async';

export class CidConfig {
  constructor(
    public base: string,
    public version: number,
    public codec: string,
    public type: string
  ) {}

  /**
   * Gets the cid configuration from a CID
   */
  static fromCid(cidStr: string) {
    const cid = new CID(cidStr);
    const hash = multihashing.multihash.decode(cid.multihash);

    return new CidConfig(cid.multibaseName, cid.version, cid.codec, hash.name);
  }
}
