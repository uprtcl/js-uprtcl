export const installOfflineWatcher = (offlineUpdatedCallback: (offline: boolean) => void) => {
  window.addEventListener('online', () => offlineUpdatedCallback(false));
  window.addEventListener('offline', () => offlineUpdatedCallback(true));
  offlineUpdatedCallback(navigator.onLine === false);
};
