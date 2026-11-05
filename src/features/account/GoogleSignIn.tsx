import React, { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { request } from "../../api/client";
import { s } from "../../design/ui";
import { colors } from "../../design/theme";

WebBrowser.maybeCompleteAuthSession();
type Config = {
  enabled: boolean;
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
};
const clientFor = (c: Config) =>
  Platform.select({
    ios: c.iosClientId,
    android: c.androidClientId,
    default: c.webClientId,
  }) || "";

/** Hidden until the API reports a Google client ID for this platform. */
export function GoogleSignIn({
  label,
  orLabel,
  onCredential,
  onFailure,
  disabled,
}: {
  label: string;
  orLabel: string;
  onCredential: (credential: string) => void;
  onFailure: () => void;
  disabled?: boolean;
}) {
  const [config, setConfig] = useState<Config | null>(null);
  useEffect(() => {
    let active = true;
    request<Config>("auth/google/config")
      .then((c) => active && c.enabled && clientFor(c) && setConfig(c))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  // The auth-session hook throws without a client ID for the platform, so it lives in a child.
  return config ? (
    <View style={{ gap: 18 }}>
      <Button
        config={config}
        label={label}
        onCredential={onCredential}
        onFailure={onFailure}
        disabled={disabled}
      />
      <View style={[s.row, { gap: 14 }]}>
        <View style={[s.divider, { flex: 1 }]} />
        <Text style={s.muted}>{orLabel}</Text>
        <View style={[s.divider, { flex: 1 }]} />
      </View>
    </View>
  ) : null;
}

function Button({
  config,
  label,
  onCredential,
  onFailure,
  disabled,
}: {
  config: Config;
  label: string;
  onCredential: (credential: string) => void;
  onFailure: () => void;
  disabled?: boolean;
}) {
  const [authRequest, response, prompt] = Google.useIdTokenAuthRequest({
    webClientId: config.webClientId || undefined,
    iosClientId: config.iosClientId || undefined,
    androidClientId: config.androidClientId || undefined,
  });
  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const token =
        response.params?.id_token ?? response.authentication?.idToken;
      if (token) onCredential(token);
      else onFailure();
    } else if (response.type === "error") onFailure();
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps
  const off = disabled || !authRequest;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={() => void prompt()}
      style={[
        s.button,
        {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.line,
          flexDirection: "row",
          gap: 12,
          opacity: off ? 0.5 : 1,
        },
      ]}
    >
      <AntDesign name="google" size={18} color={colors.ink} />
      <Text style={[s.buttonText, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}
