const CID = require('cids');
const multihashing = require('multihashing-async');

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
    const multihash = multihashing.multihash.decode(cid.multihash);

    return new CidConfig(cid.multibaseName, cid.version, cid.codec, multihash.name);
  }
}
