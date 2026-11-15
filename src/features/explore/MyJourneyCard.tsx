import React, { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import type { Booking } from "../../api/client";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { photo } from "./TourCard";
import {
  highlightTrip,
  slug,
  type Highlight,
  type Offer,
} from "../trips/model";
import { tripStatus } from "../trips/status";

/**
 * For a signed-in customer: the journey that needs attention (an offer waiting, the next confirmed
 * journey or the latest request). Shows nothing for guests or when there is nothing open.
 */
export default function MyJourneyCard() {
  const a = useAccount();
  const { t, tours, title } = useDiscovery();
  const [found, setFound] = useState<{
    pick: Highlight;
    hasOffer: boolean;
    name: string;
  } | null>(null);
  const token = a.token;
  const call = a.call;
  const load = useCallback(async () => {
    if (!token) {
      setFound(null);
      return;
    }
    try {
      const [rows, offers] = await Promise.all([
        call<Booking[]>("bookings"),
        call<Offer[]>("bookings/offers"),
      ]);
      const daysOf = (b: Booking) =>
        tours.find((x) => x.slug === slug(b))?.days || 1;
      const pick = highlightTrip(
        rows,
        offers.map((o) => o.bookingId),
        daysOf,
      );
      if (!pick) return setFound(null);
      const offer = offers.find((o) => o.bookingId === pick.booking.id);
      const tour = tours.find((x) => x.slug === slug(pick.booking));
      setFound({
        pick,
        hasOffer: !!offer,
        name: offer?.title || (tour ? title(tour) : pick.booking.title),
      });
    } catch {
      // The card is a shortcut; if it cannot load, Explore simply goes on without it.
      setFound(null);
    }
  }, [token, call, tours, title]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  if (!found) return null;
  const { pick, hasOffer, name } = found;
  const ready = pick.kind === "offer";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() =>
        router.push({
          pathname: "/trip/[id]",
          params: { id: pick.booking.id },
        })
      }
      style={[styles.card, ready && styles.cardReady]}
    >
      <Image source={photo(slug(pick.booking))} style={styles.photo} />
      <View style={styles.text}>
        <Text style={styles.kicker}>
          {t("Your journey", "Ваша поездка", "Sənin səfərin")}
        </Text>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <Text numberOfLines={2} style={[styles.status, ready && styles.accent]}>
          {tripStatus(pick.booking, hasOffer, t)}
        </Text>
        {pick.more > 0 && (
          <Text style={styles.more}>
            {t(
              "+" + pick.more + " more",
              "+ещё " + pick.more,
              "+" + pick.more + " daha",
            )}
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={22} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  cardReady: { borderColor: colors.accent, borderWidth: 2 },
  photo: { width: 64, height: 64, borderRadius: 16 },
  text: { flex: 1, gap: 2 },
  kicker: { fontFamily: "InterSemi", fontSize: 12, color: colors.accent },
  name: { fontFamily: "InterSemi", fontSize: 16, color: colors.ink },
  status: { fontFamily: "Inter", fontSize: 13, color: colors.muted },
  accent: { color: colors.accent, fontFamily: "InterSemi" },
  more: { fontFamily: "Inter", fontSize: 12, color: colors.muted },
});
