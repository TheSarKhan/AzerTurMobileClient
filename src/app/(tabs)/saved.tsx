import React from "react";
import { Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Page, Button, s } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
import TourCard from "../../features/explore/TourCard";
export default function Saved() {
  const { t, saved, tours, loading, error, load } = useDiscovery();
  const items = tours.filter((x) => saved.includes(x.slug));
  return (
    <Page>
      <Text style={s.title}>
        {t("Saved journeys", "Сохранённые поездки", "Seçilmiş səfərlər")}
      </Text>
      {loading && <ActivityIndicator color={colors.ink} />}
      {error ? (
        <Button onPress={() => void load()}>
          {t("Reload journeys", "Обновить туры", "Turları yenilə")}
        </Button>
      ) : !loading && !items.length ? (
        <>
          <Text style={s.h2}>
            {t(
              "Keep your next adventure here.",
              "Сохраните следующее приключение.",
              "Növbəti macəranı burada saxla.",
            )}
          </Text>
          <Text style={s.muted}>
            {t(
              "Save a journey to return to it later.",
              "Сохраняйте туры, чтобы вернуться к ним.",
              "Sonra baxmaq üçün turları yadda saxla.",
            )}
          </Text>
          <Button outline onPress={() => router.push("/")}>
            {t("Browse journeys", "Посмотреть туры", "Turlara bax")}
          </Button>
        </>
      ) : (
        items.map((tour) => <TourCard key={tour.slug} tour={tour} />)
      )}
    </Page>
  );
}
