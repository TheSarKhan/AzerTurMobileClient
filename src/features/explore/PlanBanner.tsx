import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";

/** The block that invites people to build a journey; the services it can include scroll sideways. */
export default function PlanBanner() {
  const { t } = useDiscovery();
  const services: {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
  }[] = [
    { icon: "home", label: t("Stay", "Жильё", "Qalma yeri") },
    { icon: "truck", label: t("Driver", "Водитель", "Sürücü") },
    { icon: "user", label: t("Guide", "Гид", "Bələdçi") },
    { icon: "navigation", label: t("Transfer", "Трансфер", "Transfer") },
    { icon: "star", label: t("Experiences", "Впечатления", "Təcrübələr") },
    { icon: "calendar", label: t("Events", "События", "Tədbirlər") },
  ];
  return (
    <View style={styles.card}>
      <View style={styles.pad}>
        <Text accessibilityRole="header" style={styles.title}>
          {t(
            "Build your own journey",
            "Соберите свой маршрут",
            "Öz səfərini qur",
          )}
        </Text>
        <Text style={styles.text}>
          {t(
            "Choose places, days and services. We confirm the rest.",
            "Выберите места, дни и услуги. Остальное подтвердим мы.",
            "Yerləri, günləri və xidmətləri seç. Qalanını biz təsdiqləyirik.",
          )}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {services.map((item) => (
          <View key={item.label} style={styles.chip}>
            <Feather name={item.icon} size={16} color={colors.white} />
            <Text style={styles.chipText}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.pad}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/booking-request")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {t("Start planning", "Начать", "Planlamağa başla")}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    paddingVertical: 20,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.ink,
  },
  pad: { paddingHorizontal: 18, gap: 8 },
  title: {
    fontFamily: "InterSemi",
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
  },
  text: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 21,
    color: "#CFE0D5",
  },
  chips: { paddingHorizontal: 18, gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  chipText: { fontFamily: "InterSemi", fontSize: 14, color: colors.white },
  button: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 23,
    backgroundColor: colors.white,
  },
  buttonText: { fontFamily: "InterSemi", fontSize: 15, color: colors.ink },
});
