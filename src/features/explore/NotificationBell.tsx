import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";

/** Bell next to the search with the number of unread notifications; opens the inbox. */
export default function NotificationBell() {
  const a = useAccount();
  const { t } = useDiscovery();
  const [unread, setUnread] = useState(0);
  const token = a.token;
  const call = a.call;
  useFocusEffect(
    useCallback(() => {
      let live = true;
      if (!token) {
        setUnread(0);
        return;
      }
      call<{ items: { read_at: string | null }[] }>("bookings/notifications")
        .then((data) => {
          if (live) setUnread(data.items.filter((n) => !n.read_at).length);
        })
        .catch(() => {
          if (live) setUnread(0);
        });
      return () => {
        live = false;
      };
    }, [token, call]),
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread
          ? t("Notifications", "Уведомления", "Bildirişlər") + ", " + unread
          : t("Notifications", "Уведомления", "Bildirişlər")
      }
      onPress={() => router.push("/notifications")}
      style={styles.bell}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.ink} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.count}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bell: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  count: { fontFamily: "InterSemi", fontSize: 11, color: colors.white },
});
