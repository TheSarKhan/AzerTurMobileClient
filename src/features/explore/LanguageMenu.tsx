import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import type { Locale } from "../../api/client";

const OPTIONS: { code: Locale; name: string }[] = [
  { code: "en", name: "English" },
  { code: "ru", name: "Русский" },
  { code: "az", name: "Azərbaycanca" },
];

/** The language picker: a small button that opens a list under it. */
export default function LanguageMenu() {
  const { locale, setLocale, t } = useDiscovery();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Language", "Язык", "Dil")}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.trigger}
      >
        <Feather name="globe" size={18} color={colors.ink} />
        <Text style={styles.code}>{locale.toUpperCase()}</Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.muted}
        />
      </Pressable>
      {open && (
        <>
          <Pressable
            accessibilityLabel={t("Close", "Закрыть", "Bağla")}
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View accessibilityRole="menu" style={styles.menu}>
            {OPTIONS.map((option, i) => (
              <Pressable
                key={option.code}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: locale === option.code }}
                onPress={() => {
                  setLocale(option.code);
                  setOpen(false);
                }}
                style={[styles.item, i > 0 && styles.itemLine]}
              >
                <Text
                  style={[
                    styles.name,
                    locale === option.code && { fontFamily: "InterSemi" },
                  ]}
                >
                  {option.name}
                </Text>
                {locale === option.code && (
                  <Feather name="check" size={18} color={colors.accent} />
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", zIndex: 30 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  code: { fontFamily: "InterSemi", fontSize: 14, color: colors.ink },
  backdrop: {
    position: "absolute",
    top: -3000,
    bottom: -3000,
    left: -3000,
    right: -3000,
    zIndex: 1,
  },
  menu: {
    position: "absolute",
    top: 56,
    right: 0,
    width: 200,
    zIndex: 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: "hidden",
    shadowColor: "#173D30",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLine: { borderTopWidth: 1, borderTopColor: colors.line },
  name: { fontFamily: "Inter", fontSize: 15, color: colors.ink },
});
