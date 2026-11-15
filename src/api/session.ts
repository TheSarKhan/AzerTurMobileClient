import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const key = "azertur.customer.session";
// In a browser the token lives in localStorage so a refresh or a new tab keeps the customer signed
// in. The server still expires it after 7 days and signing out deletes it there and here. If the
// browser blocks storage (private mode), it stays in memory for the open page.
let webMemory: string | null = null;
function webGet() {
  try {
    return globalThis.localStorage?.getItem(key) ?? webMemory;
  } catch {
    return webMemory;
  }
}
function webSet(token: string | null) {
  webMemory = token;
  try {
    if (token === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, token);
  } catch {
    // Storage is blocked: the memory copy above is all there is.
  }
}
export const readSession = () =>
  Platform.OS === "web"
    ? Promise.resolve(webGet())
    : SecureStore.getItemAsync(key);
export async function saveSession(token: string) {
  if (Platform.OS === "web") {
    webSet(token);
    return;
  }
  await SecureStore.setItemAsync(key, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
export async function clearSession() {
  webSet(null);
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
}
