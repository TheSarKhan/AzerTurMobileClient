import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { JourneysScreen } from "./JourneysScreen";
import { useDiscovery } from "../../state/discovery";
import { s } from "../../design/ui";
/** Transitional access to existing, authenticated workflows during native UI migration. */
export default function ExistingJourneyRoute({
  screen,
}: {
  screen: "account" | "trips";
}) {
  const { locale } = useDiscovery();
  const [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setRevision((n) => n + 1);
    }, []),
  );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.page}>
      <JourneysScreen
        key={revision}
        initialScreen={screen}
        initialLocale={locale}
        embedded
      />
    </SafeAreaView>
  );
}
