import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ApiError, request, type Customer, type Session } from "../api/client";
import { readSession, saveSession, clearSession } from "../api/session";
import { clearVault, clearPreviews } from "../features/documents/vault";
const Context = createContext<ReturnType<typeof useAccountState> | null>(null);
function useAccountState() {
  const [token, setToken] = useState<string | null>(null),
    [customer, setCustomer] = useState<Customer | null>(null),
    [loading, setLoading] = useState(true),
    [offline, setOffline] = useState(false);
  const epoch = useRef(0);
  async function forget() {
    epoch.current++;
    setToken(null);
    setCustomer(null);
    setOffline(false);
    setLoading(false);
    try {
      await clearSession();
    } finally {
      try {
        await clearVault();
      } finally {
        if (Platform.OS !== "web")
          await SecureStore.deleteItemAsync("azertur.owner");
      }
    }
  }
  async function refresh() {
    const generation = epoch.current;
    const saved = await readSession();
    if (!saved) {
      if (generation === epoch.current) {
        setToken(null);
        setCustomer(null);
        setLoading(false);
      }
      return;
    }
    try {
      const c = await request<Customer>("auth/me", undefined, saved);
      if (generation !== epoch.current) return;
      setToken(saved);
      setCustomer(c);
      setOffline(false);
      if (Platform.OS !== "web")
        await SecureStore.setItemAsync("azertur.owner", JSON.stringify(c), {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
    } catch (e) {
      if (generation !== epoch.current) return;
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        await forget();
      } else {
        setToken(saved);
        setOffline(true);
        if (Platform.OS !== "web") {
          const raw = await SecureStore.getItemAsync("azertur.owner");
          if (raw && generation === epoch.current) setCustomer(JSON.parse(raw));
        }
      }
    } finally {
      if (generation === epoch.current) setLoading(false);
    }
  }
  useEffect(() => {
    void Promise.resolve().then(clearPreviews).then(refresh);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function authenticate(
    path: "login" | "register" | "google",
    body: unknown,
  ) {
    const session = await request<Session>("auth/" + path, body);
    await clearVault();
    epoch.current++;
    await saveSession(session.token);
    setToken(session.token);
    setCustomer(session.customer);
    setOffline(false);
    if (Platform.OS !== "web")
      await SecureStore.setItemAsync(
        "azertur.owner",
        JSON.stringify(session.customer),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
      );
  }
  async function signOut() {
    const active = token;
    try {
      if (active) await request("auth/logout", {}, active);
    } finally {
      await forget();
    }
  }
  async function call<T>(
    path: string,
    body?: unknown,
    key?: string,
  ): Promise<T> {
    if (!token) throw new ApiError(401, "SIGN_IN_REQUIRED");
    const generation = epoch.current;
    try {
      return await request<T>(path, body, token, key);
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status === 401 &&
        generation === epoch.current
      )
        await forget();
      throw e;
    }
  }
  return {
    token,
    customer,
    loading,
    offline,
    refresh,
    authenticate,
    signOut,
    forget,
    call,
  };
}
export function AccountProvider({ children }: PropsWithChildren) {
  return <AccountScope>{children}</AccountScope>;
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw Error("Missing account provider");
  return value;
}

function AccountScope({ children }: PropsWithChildren) {
  const value = useAccountState();
  return (
    <Context.Provider value={value}>
      <React.Fragment key={value.customer?.id || "guest"}>
        {children}
      </React.Fragment>
    </Context.Provider>
  );
}
