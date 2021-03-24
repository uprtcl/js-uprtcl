export function mapAsync<T>(array: T[], callbackfn: Function): Promise<T[]> {
  return Promise.all(array.map(callbackfn as any)) as Promise<T[]>;
}

export function filterAsync<T>(array: T[], callbackfn: Function): Promise<T[]> {
  return mapAsync<T>(array, callbackfn).then((filterMap) => {
    return array.filter((value, index) => filterMap[index]);
  });
}

interface ActionItem {
  action: () => Promise<any>;
  resolve: Function;
  reject: Function;
}

// Based on https://stackoverflow.com/a/63208885/1943661
export class AsyncQueue {
  private _items: ActionItem[] = [];
  private _pendingPromise: boolean = false;

  get size() {
    return this._items.length;
  }

  private enqueueAction(item: ActionItem) {
    this._items.push(item);
  }

  private dequeueAction(): ActionItem | undefined {
    return this._items.shift();
  }

  enqueue(action: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.enqueueAction({ action, resolve, reject });
      this.dequeue();
    });
  }

  async dequeue(): Promise<boolean | undefined> {
    if (this._pendingPromise) return;

    /* the item remains in the array until it is exectuted */
    let item = this.dequeueAction();

    if (!item) return false;

    try {
      this._pendingPromise = true;

      let payload = await item.action();

      this._pendingPromise = false;
      item.resolve(payload);
    } catch (e) {
      this._pendingPromise = false;
      item.reject(e);
    } finally {
      this.dequeue();
    }

    return true;
  }
}
