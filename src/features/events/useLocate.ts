import { useState } from "react";
import * as Location from "expo-location";
import { useDiscovery } from "../../state/discovery";
import { round2 } from "./format";

/**
 * Finds the device position when asked ("Near me" turned on), never on open. The result is rounded
 * to about 1 km. A refusal or failure leaves a short note to show next to the switch.
 */
export function useLocate() {
  const { t } = useDiscovery();
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState("");
  async function locate() {
    setLocating(true);
    setNote("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setNote(
          t(
            "Location access is off. Allow it in your settings, or pick a city instead.",
            "Доступ к местоположению выключен. Разрешите его в настройках или выберите город.",
            "Məkan icazəsi bağlıdır. Parametrlərdən icazə verin və ya şəhər seçin.",
          ),
        );
        return null;
      }
      const here = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      return {
        lat: round2(here.coords.latitude),
        lng: round2(here.coords.longitude),
      };
    } catch {
      setNote(
        t(
          "We could not find your location. Try again, or pick a city instead.",
          "Не удалось определить местоположение. Повторите попытку или выберите город.",
          "Məkanı tapa bilmədik. Yenidən cəhd edin və ya şəhər seçin.",
        ),
      );
      return null;
    } finally {
      setLocating(false);
    }
  }
  return { locate, locating, note, clearNote: () => setNote("") };
}
