import React from "react";
import { useLocalSearchParams, router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JourneysScreen } from "../features/journeys/JourneysScreen";
import { Button, s } from "../design/ui";
import { useDiscovery } from "../state/discovery";
export default function BookingRequest() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { t, locale } = useDiscovery();
  return (
    <SafeAreaView style={s.page}>
      <View style={{ padding: 14 }}>
        <Button outline onPress={() => router.back()}>
          {t("Back to journeys", "К турам", "Turlara qayıt")}
        </Button>
      </View>
      <JourneysScreen
        initialScreen="journeys"
        initialLocale={locale}
        initialTourSlug={slug}
        embedded
      />
    </SafeAreaView>
  );
}
