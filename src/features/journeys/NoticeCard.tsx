import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../design/theme";
import { noticeMeta, type Tone } from "./notice-meta";

const native = Platform.OS !== "web";
const tones: Record<Tone, { fg: string; bg: string }> = {
  ink: { fg: colors.ink, bg: "#E6EEE8" },
  accent: { fg: colors.accent, bg: "#F7E5DD" },
  good: { fg: "#2F7A4F", bg: "#E1F1E7" },
  danger: { fg: colors.danger, bg: "#F6E0DB" },
};

/** One update: an icon for what happened, what it is, when, and whether it is still new. */
export default function NoticeCard({
  event,
  title,
  meta,
  read,
  index,
  reduced,
  disabled,
  onPress,
}: {
  event: string;
  title: string;
  meta: string;
  read: boolean;
  index: number;
  reduced: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { icon, tone } = noticeMeta(event);
  const color = tones[tone];
  const enter = useState(() => new Animated.Value(reduced ? 1 : 0))[0];
  const press = useState(() => new Animated.Value(1))[0];
  const dot = useState(() => new Animated.Value(read ? 0 : 1))[0];
  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index, 8) * 50,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    }).start();
  }, [reduced, index, enter]);
  useEffect(() => {
    Animated.timing(dot, {
      toValue: read ? 0 : 1,
      duration: reduced ? 0 : 260,
      useNativeDriver: native,
    }).start();
  }, [read, reduced, dot]);
  const spring = (to: number) =>
    reduced
      ? undefined
      : Animated.spring(press, {
          toValue: to,
          friction: 7,
          tension: 220,
          useNativeDriver: native,
        }).start();
  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
          { scale: press },
        ],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title + ", " + meta + (read ? "" : ", new")}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => spring(0.97)}
        onPressOut={() => spring(1)}
        style={[styles.card, !read && styles.unread]}
      >
        {!read && <View style={styles.bar} />}
        <View style={[styles.bubble, { backgroundColor: color.bg }]}>
          <Ionicons name={icon as never} size={24} color={color.fg} />
        </View>
        <View style={styles.text}>
          <Text
            numberOfLines={2}
            style={[styles.title, !read && styles.titleNew]}
          >
            {title}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        </View>
        <View style={styles.end}>
          <Animated.View style={[styles.dot, { opacity: dot }]} />
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  unread: { backgroundColor: "#FFFAF6", borderColor: "#F0CDBE" },
  bar: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.accent,
  },
  bubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 4 },
  title: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
  },
  titleNew: { fontFamily: "InterSemi" },
  meta: { fontFamily: "Inter", fontSize: 13, color: colors.muted },
  end: { alignItems: "center", gap: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});
