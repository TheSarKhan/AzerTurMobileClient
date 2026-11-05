import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
// Email links keep secrets in the fragment, outside HTTP/proxy logs. Capture once
// and remove the fragment from browser history; never persist the token.
export function useAccountLinkToken() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token] = useState(() => {
    if (typeof window === "undefined") return params.token;
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (value) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return value || params.token;
  });
  return token;
}
