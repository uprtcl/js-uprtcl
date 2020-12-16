import { Entity } from '@uprtcl/cortex';

// Auxiliar type for Holochain's get_entry call
export type EntryResult<T extends object = any> = {
  entry: Entity<T>;
  type: string;
};

export function parseZomeResponse(jsonString: any) {
  const result = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

  if (result.Err) throw new Error(JSON.stringify(result.Err));
  if (result.SerializationError) {
    throw new Error(JSON.stringify(result.SerializationError));
  }

  return parseResponse(result);
}

export function parseResponse(response: { Ok: any } | any): any {
  return response.hasOwnProperty('Ok') ? response.Ok : response;
}

export function parseEntry<T extends object>(entry: { Ok: any } | any): T {
  return JSON.parse(parseResponse(entry).App[1]);
}

export function parseEntryResult<T extends object>(entry: any): EntryResult<T> | undefined {
  entry = parseResponse(entry);
  if (!entry.result.Single.meta) return undefined;
  return {
    entry: {
      id: entry.result.Single.meta.address,
      object: parseEntry<T>(entry.result.Single.entry),
    },
    type: entry.result.Single.meta.entry_type.App,
  };
}

export function parseEntries<T extends object>(entryArray: Array<any>): Array<T> {
  return entryArray.map((entry) => parseEntry(entry));
}

export function parseEntriesResults<T extends object>(
  entryArray: Array<any>
): Array<EntryResult<T>> {
  return entryArray
    .map((entry) => parseEntryResult<T>(parseResponse(entry)))
    .filter((entry) => entry != undefined) as Array<EntryResult<T>>;
}
