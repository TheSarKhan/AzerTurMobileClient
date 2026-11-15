import { useEffect, useState } from "react";
import { getCities, type City } from "./api";

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  useEffect(() => {
    let live = true;
    getCities()
      .then((list) => live && setCities(list))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return cities;
}
