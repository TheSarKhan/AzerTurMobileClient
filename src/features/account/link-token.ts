import { useLocalSearchParams } from "expo-router";
export function useAccountLinkToken() {
  return useLocalSearchParams<{ token?: string }>().token;
}
