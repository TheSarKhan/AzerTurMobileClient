import React from "react";
import { Image, Text, View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, Button, s } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
import { photo } from "../../features/explore/TourCard";
export default function Detail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, tours, title, loading, error, load, saved, toggle } =
    useDiscovery();
  const tour = tours.find((x) => x.slug === slug);
  if (!tour)
    return (
      <Page back>
        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <Text style={s.h2}>
              {error
                ? t(
                    "Could not load this journey.",
                    "Тур не загружен.",
                    "Tur yüklənmədi.",
                  )
                : t("Journey not found.", "Тур не найден.", "Tur tapılmadı.")}
            </Text>
            <Button onPress={() => void load()}>
              {t("Try again", "Повторить", "Yenidən yoxla")}
            </Button>
          </>
        )}
      </Page>
    );
  return (
    <Page
      back
      title={t("Journey details", "Детали поездки", "Səfərin detalları")}
    >
      <Image
        source={photo(slug)}
        style={{ height: 250, width: "100%", borderRadius: 12 }}
        accessibilityLabel={title(tour)}
      />
      <Text accessibilityRole="header" style={s.title}>
        {title(tour)}
      </Text>
      <Text style={s.muted}>
        {tour.days}{" "}
        {t(
          tour.days === 1 ? "day · Private journey" : "days · Private journey",
          "дн. · Частный тур",
          "gün · Fərdi səfər",
        )}
      </Text>
      <Text style={s.h2}>
        {t("From", "От", "Başlayan qiymət")} €{tour.fromPriceEur} /{" "}
        {t("person", "чел.", "nəfər")}
      </Text>
      <View style={s.divider} />
      <Text style={s.h2}>
        {t("Your journey", "Ваша поездка", "Sənin səfərin")}
      </Text>
      <Text style={s.body}>
        {t(
          "A private journey through",
          "Индивидуальная поездка по региону",
          "Fərdi səfər bölgəsi:",
        )}{" "}
        {tour.region}.
      </Text>
      <Text style={s.muted}>
        {t(
          "Choose dates, travelers and services in your request. Our team checks availability and prepares the final itinerary and price.",
          "Выберите даты и путешественников. Команда проверит доступность и подготовит маршрут и цену.",
          "Tarixləri, səyahətçiləri və xidmətləri sorğuda seç. Komanda mövcudluğu yoxlayıb marşrutu və yekun qiyməti hazırlayacaq.",
        )}
      </Text>
      <Button
        onPress={() =>
          router.push({
            pathname: "/booking-request",
            params: { slug: tour.slug },
          })
        }
      >
        {t(
          "Request this journey",
          "Запросить поездку",
          "Bu səfər üçün sorğu göndər",
        )}
      </Button>
      <Button outline onPress={() => toggle(tour.slug)}>
        {saved.includes(tour.slug)
          ? t(
              "Remove from saved",
              "Убрать из сохранённых",
              "Seçilmişlərdən sil",
            )
          : t("Save journey", "Сохранить", "Səfəri yadda saxla")}
      </Button>
    </Page>
  );
}
