import { AddressMapping, IdentitySource, mappingMsg } from '@uprtcl/orbitdb-provider';

const storeQueue: any = {};

export const validateMappedAddress = async (
  orbitdb: any,
  identitySource: IdentitySource,
  remote: string,
  creatorId: string,
  orbitdbkey: string
) => {
  const mappingEntity = {
    sourceId: remote,
    key: orbitdbkey
  };

  const address = (
    await orbitdb.determineAddress(
      AddressMapping.name(mappingEntity),
      AddressMapping.type,
      AddressMapping.options(mappingEntity)
    )
  ).toString();

  let db;
  if (orbitdb.stores[address]) {
    // this.logger.log(`${address} -- Store loaded. HadDB: ${hadDB}`);
    db = orbitdb.stores[address];
  } else if (storeQueue[address]) {
    // this.logger.log(`${address} -- Store already queue. HadDB: ${hadDB}`);
    db = storeQueue[address];
  } else {
    db = storeQueue[address] = orbitdb
      .open(address, { identity: orbitdb.identity })
      .then(async store => {
        await store.load();
        return store;
      });
  }

  db = await db;
  delete storeQueue[address];

  const [signedAccountEntry] = db.iterator({ limit: 1 }).collect();

  const signature = signedAccountEntry.payload.value;
  const message = mappingMsg(orbitdbkey);
  const signer = await identitySource.verify(message, signature);

  if (signer === creatorId) {
    return true;
  }

  return false;
};
