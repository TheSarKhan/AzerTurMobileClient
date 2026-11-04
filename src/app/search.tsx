import React, { useState } from "react";
import {
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Page, Button, s } from "../design/ui";
import { colors } from "../design/theme";
import { useDiscovery, matching } from "../state/discovery";
import TourCard from "../features/explore/TourCard";
export default function Search() {
  const { t, tours, filter, reset, loading, error, load } = useDiscovery();
  const [query, setQuery] = useState("");
  const result = tours.filter((x) => matching(x, query, filter));
  return (
    <Page back title={t("Explore", "Обзор", "Kəşf et")}>
      <Text style={s.title}>
        {t(
          "Find your next journey.",
          "Найдите следующую поездку.",
          "Növbəti səfərini tap.",
        )}
      </Text>
      <TextInput
        autoFocus
        accessibilityLabel={t("Search journeys", "Поиск туров", "Tur axtar")}
        placeholder={t(
          "Destination or journey",
          "Город или маршрут",
          "Məkan və ya tur",
        )}
        value={query}
        onChangeText={setQuery}
        style={s.field}
      />
      <View style={s.between}>
        <Text style={s.muted}>
          {result.length} {t("journeys", "туров", "tur")}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={[s.icon, s.row]}
          onPress={() => router.push("/filters")}
        >
          <Feather name="sliders" size={20} color={colors.ink} />
          <Text style={s.body}>{t("Filters", "Фильтры", "Filtrlər")}</Text>
        </Pressable>
      </View>
      {loading && <ActivityIndicator color={colors.ink} />}
      {error && (
        <Button onPress={() => void load()}>
          {t(
            "Could not load. Try again",
            "Повторить загрузку",
            "Yüklənmədi. Yenidən yoxla",
          )}
        </Button>
      )}
      {!loading && !error && !result.length && (
        <>
          <Text style={s.h2}>
            {t(
              "No matching journeys yet.",
              "Подходящих туров пока нет.",
              "Uyğun tur tapılmadı.",
            )}
          </Text>
          <Text style={s.muted}>
            {t(
              "Try another destination or adjust your filters.",
              "Измените город или фильтры.",
              "Başqa məkan axtar və ya filtrləri dəyiş.",
            )}
          </Text>
          <Button
            outline
            onPress={() => {
              reset();
              setQuery("");
            }}
          >
            {t(
              "Clear search and filters",
              "Сбросить поиск и фильтры",
              "Axtarışı və filtrləri təmizlə",
            )}
          </Button>
        </>
      )}
      {result.map((tour) => (
        <TourCard key={tour.slug} tour={tour} />
      ))}
    </Page>
  );
}
