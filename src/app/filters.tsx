import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Page, Button, s } from "../design/ui";
import { colors } from "../design/theme";
import { useDiscovery } from "../state/discovery";
export default function Filters() {
  const { t, filter, setFilter } = useDiscovery();
  const [draft, setDraft] = useState(filter),
    [max, setMax] = useState(filter.max === null ? "" : String(filter.max)),
    [error, setError] = useState("");
  return (
    <Page back title={t("Filters", "Фильтры", "Filtrlər")}>
      <Text style={s.h2}>{t("Regions", "Регионы", "Bölgələr")}</Text>
      {(
        [
          {
            id: "all",
            label: t("All regions", "Все регионы", "Bütün bölgələr"),
          },
          {
            id: "nature",
            label: t(
              "Mountains & nature",
              "Горы и природа",
              "Dağlar və təbiət",
            ),
          },
          {
            id: "culture",
            label: t(
              "Heritage cities",
              "Исторические города",
              "Tarixi şəhərlər",
            ),
          },
          {
            id: "city",
            label: t("Baku & city", "Баку и город", "Bakı və şəhər"),
          },
        ] as const
      ).map((x) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: draft.region === x.id }}
          key={x.id}
          style={[s.row, { minHeight: 48 }]}
          onPress={() => setDraft({ ...draft, region: x.id })}
        >
          <Feather
            name={draft.region === x.id ? "check-circle" : "circle"}
            size={23}
            color={colors.ink}
          />
          <Text style={s.body}>{x.label}</Text>
        </Pressable>
      ))}
      <View style={s.divider} />
      <Text style={s.h2}>{t("Duration", "Длительность", "Müddət")}</Text>
      {(["all", "1", "2-3", "4+"] as const).map((id) => (
        <Pressable
          key={id}
          accessibilityRole="radio"
          accessibilityState={{ checked: draft.duration === id }}
          style={[s.row, { minHeight: 48 }]}
          onPress={() => setDraft({ ...draft, duration: id })}
        >
          <Feather
            name={draft.duration === id ? "check-circle" : "circle"}
            size={23}
            color={colors.ink}
          />
          <Text style={s.body}>
            {id === "all"
              ? t("Any duration", "Любая", "İstənilən")
              : id + " " + t(id === "1" ? "day" : "days", "дн.", "gün")}
          </Text>
        </Pressable>
      ))}
      <View style={s.divider} />
      <Text style={s.h2}>
        {t(
          "Maximum starting price (EUR)",
          "Макс. начальная цена (EUR)",
          "Maksimum başlanğıc qiymət (EUR)",
        )}
      </Text>
      <TextInput
        accessibilityLabel={t(
          "Maximum price in EUR",
          "Максимальная цена в EUR",
          "Maksimum qiymət EUR",
        )}
        keyboardType="numeric"
        value={max}
        onChangeText={setMax}
        placeholder={t("No limit", "Без ограничений", "Limitsiz")}
        style={s.field}
      />
      <Text style={s.muted}>
        {t(
          "Starting estimates per person. Final services are reviewed by our team.",
          "Начальная цена за человека. Услуги проверяет команда.",
          "Bir nəfər üçün başlanğıc qiymət. Xidmətləri komanda yoxlayır.",
        )}
      </Text>
      {!!error && (
        <Text accessibilityRole="alert" style={s.body}>
          {error}
        </Text>
      )}
      <Button
        onPress={() => {
          const value = max.trim() === "" ? null : Number(max);
          if (
            value !== null &&
            (!Number.isFinite(value) || value < 0 || value > 1000000)
          ) {
            setError(
              t(
                "Enter a valid nonnegative amount.",
                "Введите корректную сумму.",
                "Düzgün müsbət məbləğ daxil et.",
              ),
            );
            return;
          }
          setFilter({ ...draft, max: value });
          router.back();
        }}
      >
        {t("Apply filters", "Применить", "Filtrləri tətbiq et")}
      </Button>
      <Button
        outline
        onPress={() => {
          setDraft({ region: "all", duration: "all", max: null });
          setMax("");
          setError("");
        }}
      >
        {t("Clear all", "Сбросить", "Hamısını təmizlə")}
      </Button>
    </Page>
  );
}
