//client/src/utils/auth.js
function storage() {
  if (typeof window === "undefined") return null;

  const persistentStore = window.localStorage;
  const temporaryStore = window.sessionStorage;

  for (const key of ["accessToken", "refreshToken"]) {
    const legacyToken = temporaryStore.getItem(key);

    if (!persistentStore.getItem(key) && legacyToken) {
      persistentStore.setItem(key, legacyToken);
    }

    if (legacyToken) temporaryStore.removeItem(key);
  }

  return persistentStore;
}

export function setToken(token) {
  const store = storage();
  if (store) store.setItem("accessToken", token);
}

export function getToken() {
  return storage()?.getItem("accessToken") || null;
}

export function setRefreshToken(token) {
  const store = storage();
  if (store) store.setItem("refreshToken", token);
}

export function getRefreshToken() {
  return storage()?.getItem("refreshToken") || null;
}

export function logout() {
  const store = storage();
  if (store) {
    store.removeItem("accessToken");
    store.removeItem("refreshToken");
  }
}
