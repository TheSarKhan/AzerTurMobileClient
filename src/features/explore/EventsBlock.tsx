import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { getEvents, type EventView } from "../events/api";
import ExploreSection from "./ExploreSection";
import EventTile, { EVENT_WIDTH } from "./EventTile";

/** Upcoming events as their own block on Explore. Shows nothing while loading or when there are none. */
export default function EventsBlock() {
  const { t } = useDiscovery();
  const [items, setItems] = useState<EventView[]>([]);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let live = true;
    getEvents(new URLSearchParams({ page: "0", size: "8" }))
      .then((data) => {
        if (!live) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!items.length) return null;
  return (
    <ExploreSection
      title={t("Events", "События", "Tədbirlər")}
      icon={<Ionicons name="calendar-outline" size={18} color={colors.ink} />}
      note={String(total)}
      snap={EVENT_WIDTH + 12}
      action={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("See all events", "Все события", "Bütün tədbirlər")}
          onPress={() => router.push("/events")}
          hitSlop={8}
        >
          <Text style={styles.all}>{t("See all", "Все", "Hamısı")}</Text>
        </Pressable>
      }
    >
      {items.map((event) => (
        <EventTile key={event.slug} event={event} />
      ))}
    </ExploreSection>
  );
}

const styles = StyleSheet.create({
  all: { fontFamily: "InterSemi", fontSize: 13, color: colors.accent },
});
