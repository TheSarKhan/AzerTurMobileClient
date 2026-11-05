import React, { useState } from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Page, Button, s } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery, category } from "../../state/discovery";
import TourCard from "../../features/explore/TourCard";
export default function Explore() {
  const { t, tours, loading, error, load, locale, setLocale, storageError } =
    useDiscovery();
  const [selected, setSelected] = useState("nature");
  const visible = tours.filter((x) => category(x) === selected);
  return (
    <Page>
      <View style={s.between}>
        <Text style={[s.h2, { fontSize: 31 }]}>azərtur</Text>
        <View style={s.row}>
          {(["en", "ru", "az"] as const).map((l) => (
            <Pressable
              key={l}
              accessibilityLabel={"Language " + l}
              accessibilityRole="button"
              accessibilityState={{ selected: locale === l }}
              onPress={() => setLocale(l)}
              style={[
                s.icon,
                locale === l && {
                  borderBottomColor: colors.accent,
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Text style={s.body}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text accessibilityRole="header" style={s.title}>
        {t(
          "Take the scenic route.",
          "Выбирайте живописный маршрут.",
          "Öz marşrutunu seç.",
        )}
      </Text>
      <Text style={s.muted}>
        {t(
          "Discover Azerbaijan, your way.",
          "Откройте Азербайджан в своём ритме.",
          "Azərbaycanı öz ritminlə kəşf et.",
        )}
      </Text>
      <Pressable
        accessibilityRole="button"
        style={[s.field, s.row]}
        onPress={() => router.push("/search")}
      >
        <Feather name="search" size={20} color={colors.ink} />
        <Text style={s.muted}>
          {t(
            "Where would you like to go?",
            "Куда хотите поехать?",
            "Hara getmək istəyirsən?",
          )}
        </Text>
      </Pressable>
      <View style={s.row}>
        {(
          [
            { key: "nature", text: t("Nature", "Природа", "Təbiət") },
            { key: "culture", text: t("Culture", "Культура", "Mədəniyyət") },
            { key: "city", text: t("City", "Город", "Şəhər") },
          ] as const
        ).map((item) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: selected === item.key }}
            key={item.key}
            onPress={() => setSelected(item.key)}
            style={{
              minHeight: 44,
              padding: 10,
              borderBottomWidth: 2,
              borderBottomColor:
                selected === item.key ? colors.accent : "transparent",
            }}
          >
            <Text style={s.body}>{item.text}</Text>
          </Pressable>
        ))}
      </View>
      {loading && <ActivityIndicator color={colors.ink} />}
      {error && (
        <>
          <Text accessibilityRole="alert" style={s.body}>
            {t(
              "Could not load journeys. Check your connection.",
              "Не удалось загрузить туры. Проверьте подключение.",
              "Turlar yüklənmədi. Bağlantını yoxla.",
            )}
          </Text>
          <Button onPress={() => void load()}>
            {t("Try again", "Повторить", "Yenidən yoxla")}
          </Button>
        </>
      )}
      {!loading && !error && !visible.length && (
        <Text style={s.body}>
          {t(
            "No journeys in this category yet.",
            "Пока нет туров в этой категории.",
            "Bu kateqoriyada hələ tur yoxdur.",
          )}
        </Text>
      )}
      {visible.map((tour) => (
        <TourCard key={tour.slug} tour={tour} />
      ))}
      <Button outline onPress={() => router.push("/booking-request")}>
        {t("Plan a journey →", "Запросить поездку →", "Səfər planla →")}
      </Button>
      <Button outline onPress={() => router.push("/events")}>
        {t("Events near you →", "События рядом →", "Yaxınlıqdakı tədbirlər →")}
      </Button>
      {storageError && (
        <Text accessibilityRole="alert" style={s.muted}>
          {t(
            "Your preferences could not be saved on this device.",
            "Не удалось сохранить настройки на устройстве.",
            "Seçimlər bu cihazda saxlanılmadı.",
          )}
        </Text>
      )}
    </Page>
  );
}
