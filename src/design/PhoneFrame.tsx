import React, {
  createContext,
  useContext,
  useSyncExternalStore,
} from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./theme";

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const BEZEL = 12;
const STATUS = 34;

/** The width the app is laid out in: the phone's width inside the frame, the window's otherwise. */
const FrameWidth = createContext<number | null>(null);
export function useViewportWidth() {
  const framed = useContext(FrameWidth);
  const { width } = useWindowDimensions();
  return framed ?? width;
}

// A phone or tablet reports a coarse pointer; a desktop browser with a mouse does not.
const subscribePointer = (notify: () => void) => {
  if (Platform.OS !== "web" || typeof window === "undefined") return () => {};
  const query = window.matchMedia("(pointer: coarse)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const hasMouse = () =>
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  !window.matchMedia("(pointer: coarse)").matches;

/**
 * On a desktop browser the app is shown inside a phone, centred on the page. On a real phone, or any
 * narrow or touch screen, the app fills the screen as usual.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const mouse = useSyncExternalStore(subscribePointer, hasMouse, () => false);
  const framed = mouse && width >= 760 && height >= 620;
  if (!framed) return <>{children}</>;
  const screenHeight = Math.min(PHONE_HEIGHT, height - 48 - BEZEL * 2);
  const web = (style: object) => style as never;
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e7e4da",
      }}
    >
      <View
        style={web({
          width: PHONE_WIDTH + BEZEL * 2,
          height: screenHeight + BEZEL * 2,
          padding: BEZEL,
          borderRadius: 56,
          backgroundColor: "#15181a",
          boxShadow: "0 30px 80px rgba(20, 30, 25, 0.35), 0 0 0 2px #2b2f31",
        })}
      >
        <View
          style={web({
            flex: 1,
            borderRadius: 44,
            overflow: "hidden",
            backgroundColor: colors.paper,
            // Keeps anything positioned against the screen inside the phone.
            transform: "translateZ(0)",
          })}
        >
          <View
            style={{
              height: STATUS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.paper,
            }}
          >
            <View
              style={{
                width: 104,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#15181a",
              }}
            />
          </View>
          <FrameWidth.Provider value={PHONE_WIDTH}>
            {/* The navigators size themselves from this provider, so it has to live inside the phone. */}
            <SafeAreaProvider style={{ flex: 1 }}>{children}</SafeAreaProvider>
          </FrameWidth.Provider>
        </View>
      </View>
    </View>
  );
}
