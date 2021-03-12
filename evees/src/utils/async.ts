export function mapAsync<T>(array: T[], callbackfn: Function): Promise<T[]> {
  return Promise.all(array.map(callbackfn as any)) as Promise<T[]>;
}

export function filterAsync<T>(array: T[], callbackfn: Function): Promise<T[]> {
  return mapAsync<T>(array, callbackfn).then((filterMap) => {
    return array.filter((value, index) => filterMap[index]);
  });
}
