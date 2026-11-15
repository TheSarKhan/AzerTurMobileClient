import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";

/** Same categories, order and names as the website's category filter. */
export type CategoryId =
  "history" | "culture" | "medical" | "nature" | "entertainment" | "business";

export const categoryList: {
  id: CategoryId;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: [string, string, string];
}[] = [
  {
    id: "history",
    icon: "time-outline",
    label: ["History", "История", "Tarix"],
  },
  {
    id: "culture",
    icon: "library-outline",
    label: ["Culture", "Культура", "Mədəniyyət"],
  },
  {
    id: "medical",
    icon: "medkit-outline",
    label: ["Medical", "Лечение", "Tibbi turizm"],
  },
  {
    id: "nature",
    icon: "leaf-outline",
    label: ["Nature", "Природа", "Təbiət"],
  },
  {
    id: "entertainment",
    icon: "sparkles-outline",
    label: ["Entertainment", "Развлечения", "Əyləncə"],
  },
  {
    id: "business",
    icon: "briefcase-outline",
    label: ["Business", "Бизнес", "Biznes"],
  },
];

/** What the API sends is used. An older API without the field falls back to the picture. */
export function categoriesOf(tour: { categories?: string[]; image: string }) {
  if (tour.categories) return tour.categories;
  if (tour.image === "baku") return ["history", "culture", "entertainment"];
  if (tour.image === "sheki") return ["history", "culture", "nature"];
  return ["nature"];
}
