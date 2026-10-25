import { StatusBar } from "expo-status-bar";
import { JourneysScreen } from "./src/features/journeys/JourneysScreen";
export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <JourneysScreen />
    </>
  );
}
