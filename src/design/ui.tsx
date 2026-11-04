import React, { type PropsWithChildren } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, heading } from "./theme";
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: {
    padding: 22,
    gap: 20,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  title: {
    fontFamily: heading,
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42,
    color: colors.ink,
  },
  h2: {
    fontFamily: heading,
    fontWeight: "700",
    fontSize: 25,
    color: colors.ink,
  },
  body: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
  },
  muted: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  button: {
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { fontFamily: "InterSemi", fontSize: 15, color: colors.white },
  field: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    paddingHorizontal: 16,
    minHeight: 50,
    fontFamily: "Inter",
    fontSize: 16,
    color: colors.ink,
  },
  icon: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: colors.line },
});
export function Page({
  children,
  back,
  title,
}: PropsWithChildren<{ back?: boolean; title?: string }>) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.page}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {(back || title) && (
          <View style={s.row}>
            {back && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={s.icon}
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/")
                }
              >
                <Feather name="arrow-left" size={23} color={colors.ink} />
              </Pressable>
            )}
            {title && (
              <Text style={[s.body, { fontFamily: "InterSemi" }]}>{title}</Text>
            )}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Button({
  children,
  onPress,
  outline = false,
  disabled = false,
  style,
}: PropsWithChildren<{
  onPress: () => void;
  outline?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={[
        s.button,
        outline && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.ink,
        },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text style={[s.buttonText, outline && { color: colors.ink }]}>
        {children}
      </Text>
    </Pressable>
  );
}
