import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const key = "azertur.customer.session";
let webMemory: string | null = null;
export const readSession = () =>
  Platform.OS === "web"
    ? Promise.resolve(webMemory)
    : SecureStore.getItemAsync(key);
export async function saveSession(token: string) {
  if (Platform.OS === "web") {
    webMemory = token;
    return;
  }
  await SecureStore.setItemAsync(key, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
export async function clearSession() {
  webMemory = null;
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
}
