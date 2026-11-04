import { Platform } from "react-native";
export const colors = {
  paper: "#FAF8F3",
  ink: "#173D30",
  accent: "#BD5632",
  muted: "#66716B",
  line: "#D8DDD5",
  white: "#FFFFFF",
  danger: "#A13524",
};
export const heading = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});
export const space = { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 };
