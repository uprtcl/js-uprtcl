import CBOR from 'cbor-js';
import { AddressMapping, IdentitySource, mappingMsg } from '@uprtcl/orbitdb-provider';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '@uprtcl/evees';

const storeQueue: any = {};

export const checkToPerspectiveCreator = async (
  orbitdb: any,
  perspectiveId: string,
  orbitdbKey: string,
  identitySources: IdentitySource[]
): Promise<boolean> => {
  const result = await orbitdb._ipfs.dag.get(perspectiveId);
  const forceBuffer = Uint8Array.from(result.value);
  const { payload: toPerspective } = CBOR.decode(forceBuffer.buffer) as Signed<Perspective>;

  const toPerspIdentitySource = identitySources.find(s => s.sourceId === toPerspective.remote);

  if (!toPerspIdentitySource) {
    // if not identity source for this remote, creator must be the orbtidb identity
    if (toPerspective.creatorId === orbitdbKey) {
      return true;
    }
  } else {
    const valid = await validateMappedAddress(
      orbitdb,
      toPerspIdentitySource,
      toPerspective.remote,
      toPerspective.creatorId,
      orbitdbKey
    );
    if (valid) {
      return true;
    }
  }
  return false;
};

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
