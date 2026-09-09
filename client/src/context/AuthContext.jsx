//client/src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import { getProfile } from "../services/api";
import {
  getToken,
  setRefreshToken,
  setToken,
  logout as clearStoredAuth,
} from "../utils/auth";
import { ensurePushSubscription } from "../registerServiceWorker";

const AuthContext = createContext(null);

function parseToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredAuth();

    setTokenState(null);

    setUser(null);
  }, []);

  const hydrateUser = useCallback(async () => {
    const fallbackToken = getToken();

    try {
      const profile = await getProfile();

      setUser(profile.user);
      setTokenState(getToken());
    } catch (error) {
      console.error(error);

      if (!getToken()) {
        logout();
        return;
      }

      const parsedUser = fallbackToken ? parseToken(fallbackToken) : null;

      if (parsedUser) {
        setUser(parsedUser);
        setTokenState(fallbackToken);
      } else {
        logout();
      }
    }
  }, [logout]);

  const updateToken = useCallback(
    async (newToken) => {
      setToken(newToken);

      const parsedUser = parseToken(newToken);

      if (!parsedUser) {
        logout();
        return;
      }

      setTokenState(newToken);
      setUser(parsedUser);

      await hydrateUser();

      ensurePushSubscription();
    },
    [logout, hydrateUser],
  );

  const login = useCallback(
    async (newToken, refreshToken) => {
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      await updateToken(newToken);
    },
    [updateToken],
  );

  useEffect(() => {
    async function syncAuth() {
      const storedToken = getToken();

      if (!storedToken) {
        setTokenState(null);

        setUser(null);

        setLoading(false);

        return;
      }
      setTokenState(storedToken);

      const parsedUser = parseToken(storedToken);

      if (parsedUser) {
        setUser(parsedUser);
      } else {
        logout();
        setLoading(false);
        return;
      }

      await hydrateUser();

      setLoading(false);
    }

    syncAuth();

    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, [logout, hydrateUser]);

  const value = useMemo(() => {
    return {
      token,

      user,

      loading,

      isLoggedIn: !!token,

      isAdmin: user?.role === "admin",

      isSubadmin: user?.role === "subadmin",

      isAdminOrSubadmin: user?.role === "admin" || user?.role === "subadmin",

      login,

      updateToken,

      logout,

      setUser,
    };
  }, [token, user, loading, updateToken, logout, login]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
  return useContext(AuthContext);
}
