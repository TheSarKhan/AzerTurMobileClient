import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../state/discovery";
import { colors } from "./theme";
import { useReducedMotion } from "../features/journeys/useReducedMotion";

const native = Platform.OS !== "web";

/**
 * Keeps a bottom sheet mounted while it slides up or away. The content is built only while mounted,
 * so any draft it holds starts fresh each time the sheet opens.
 */
export function SheetHost({
  open,
  children,
}: {
  open: boolean;
  children: (rise: Animated.Value) => React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [rise] = useState(() => new Animated.Value(0));
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    Animated.timing(rise, {
      toValue: open ? 1 : 0,
      duration: reduced ? 0 : open ? 300 : 220,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: native,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, reduced, rise]);
  if (!mounted) return null;
  return <>{children(rise)}</>;
}

/**
 * The sheet itself: dimmed backdrop, grip, title, scrolling body and a footer with Reset and the
 * main button. It fills the screen it is placed in (not the whole browser window).
 */
export function SheetFrame({
  rise,
  title,
  onClose,
  onReset,
  canReset,
  applyLabel,
  canApply,
  onApply,
  children,
}: {
  rise: Animated.Value;
  title: string;
  onClose: () => void;
  onReset: () => void;
  canReset: boolean;
  applyLabel: string;
  canApply: boolean;
  onApply: () => void;
  children: React.ReactNode;
}) {
  const { t } = useDiscovery();
  const { height } = useWindowDimensions();
  const max = Math.min(height * 0.86, 720);
  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: rise }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Close", "Закрыть", "Bağla")}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            maxHeight: max,
            transform: [
              {
                translateY: rise.interpolate({
                  inputRange: [0, 1],
                  outputRange: [max, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.grip} />
        <View style={styles.head}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Close", "Закрыть", "Bağla")}
            onPress={onClose}
            hitSlop={8}
            style={styles.close}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        <View style={styles.foot}>
          <Pressable
            accessibilityRole="button"
            disabled={!canReset}
            onPress={onReset}
            style={[styles.reset, !canReset && styles.resetOff]}
          >
            <Text style={styles.resetText}>
              {t("Reset", "Сбросить", "Sıfırla")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!canApply}
            onPress={onApply}
            style={[styles.apply, !canApply && styles.applyOff]}
          >
            <Text style={styles.applyText}>{applyLabel}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

export function SheetChip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function SheetSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 50, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(16, 30, 24, 0.45)",
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    overflow: "hidden",
  },
  grip: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD3CB",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontFamily: "InterSemi", fontSize: 22, color: colors.ink },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECEFE8",
  },
  body: { paddingHorizontal: 22, paddingBottom: 12, gap: 6 },
  section: { gap: 10, paddingVertical: 12 },
  sectionTitle: { fontFamily: "InterSemi", fontSize: 15, color: colors.ink },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 15,
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: "Inter", fontSize: 14, color: colors.ink },
  chipTextOn: { color: colors.white, fontFamily: "InterSemi" },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  reset: { paddingHorizontal: 8, minHeight: 52, justifyContent: "center" },
  resetOff: { opacity: 0.4 },
  resetText: { fontFamily: "InterSemi", fontSize: 15, color: colors.ink },
  apply: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  applyOff: { backgroundColor: "#9AA79F" },
  applyText: { fontFamily: "InterSemi", fontSize: 16, color: colors.white },
});
