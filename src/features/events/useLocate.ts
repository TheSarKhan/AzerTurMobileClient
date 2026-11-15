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
            "Location is off. Pick a city instead.",
            "Геолокация выключена. Выберите город.",
            "Məkan icazəsi yoxdur. Şəhər seçin.",
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
          "We could not find your location. Pick a city instead.",
          "Не удалось определить местоположение. Выберите город.",
          "Məkanı tapa bilmədik. Şəhər seçin.",
        ),
      );
      return null;
    } finally {
      setLocating(false);
    }
  }
  return { locate, locating, note, clearNote: () => setNote("") };
}
