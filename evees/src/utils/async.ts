export function mapAsync(array, callbackfn) {
  return Promise.all(array.map(callbackfn));
}

export function filterAsync(array, callbackfn) {
  return mapAsync(array, callbackfn).then((filterMap) => {
    return array.filter((value, index) => filterMap[index]);
  });
}
