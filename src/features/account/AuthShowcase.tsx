import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const slides = [
  {
    image: require("../../../assets/photos/khinalug.png"),
    place: ["Khinalug", "Хыналуг", "Xınalıq"],
  },
  {
    image: require("../../../assets/photos/baku.png"),
    place: ["Baku", "Баку", "Bakı"],
  },
  {
    image: require("../../../assets/photos/sheki.png"),
    place: ["Sheki", "Шеки", "Şəki"],
  },
  {
    image: require("../../../assets/photos/gabala.png"),
    place: ["Gabala", "Габала", "Qəbələ"],
  },
] as const;
// Many faint strips approximate a bottom gradient without another native dependency.
const SHADE_STEPS = Array.from({ length: 40 }, (_, i) => i + 1);
const HOLD = 7000;
const FADE = 1600;
const native = Platform.OS !== "web";

/** Slow cross-fading photographs with a gentle zoom; stands still when reduce-motion is on. */
export function AuthShowcase({
  locale,
  style,
  quote,
}: {
  locale: "en" | "ru" | "az";
  style?: StyleProp<ViewStyle>;
  quote?: string;
}) {
  const [active, setActive] = useState(0),
    [still, setStill] = useState(false),
    [opacity] = useState(() =>
      slides.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
    ),
    [zoom] = useState(() => slides.map(() => new Animated.Value(1))),
    pick = (v: readonly string[]) =>
      locale === "az" ? v[2] : locale === "ru" ? v[1] : v[0];
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setStill);
  }, []);
  useEffect(() => {
    if (still) return;
    const zoomIn = (i: number) => {
      zoom[i].setValue(1);
      Animated.timing(zoom[i], {
        toValue: 1.14,
        duration: HOLD + FADE * 2,
        easing: Easing.linear,
        useNativeDriver: native,
      }).start();
    };
    zoomIn(active);
    const timer = setTimeout(() => {
      const next = (active + 1) % slides.length;
      zoomIn(next);
      Animated.parallel([
        Animated.timing(opacity[next], {
          toValue: 1,
          duration: FADE,
          useNativeDriver: native,
        }),
        Animated.timing(opacity[active], {
          toValue: 0,
          duration: FADE,
          useNativeDriver: native,
        }),
      ]).start(() => setActive(next));
    }, HOLD);
    return () => clearTimeout(timer);
  }, [active, still, opacity, zoom]);
  return (
    <View
      style={[styles.root, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {slides.map((slide, i) => (
        <Animated.Image
          key={i}
          source={slide.image}
          resizeMode="cover"
          style={[
            StyleSheet.absoluteFill,
            { opacity: opacity[i], transform: [{ scale: zoom[i] }] },
          ]}
        />
      ))}
      {SHADE_STEPS.map((k) => (
        <View
          key={k}
          pointerEvents="none"
          style={[
            styles.shade,
            { height: `${k * (62 / SHADE_STEPS.length)}%` },
          ]}
        />
      ))}
      <View style={styles.caption} pointerEvents="none">
        <Text style={styles.place}>
          {pick(slides[active].place).toUpperCase()}
        </Text>
        {quote ? <Text style={styles.quote}>{quote}</Text> : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { overflow: "hidden", backgroundColor: "#173D30" },
  shade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(20,26,21,0.022)",
  },
  caption: { position: "absolute", left: 24, right: 24, bottom: 20, gap: 8 },
  place: {
    color: "#fff",
    fontFamily: "Inter",
    fontSize: 12,
    letterSpacing: 1.6,
    opacity: 0.9,
  },
  quote: {
    color: "#fff",
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "Georgia",
    }),
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
});
