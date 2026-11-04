import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlannerDraft } from "./planner";
import { getTours, type Tour, type Locale } from "../api/client";
type Filter = {
  region: "all" | "nature" | "culture" | "city";
  duration: "all" | "1" | "2-3" | "4+";
  max: number | null;
};
const empty: Filter = { region: "all", duration: "all", max: null };
function useDiscoveryState() {
  const [tours, setTours] = useState<Tour[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [locale, setLocale] = useState<Locale>("en"),
    [saved, setSaved] = useState<string[]>([]),
    [filter, setFilter] = useState<Filter>(empty),
    [storageError, setStorageError] = useState(false),
    [ready, setReady] = useState(false);
  const [planner, setPlanner] = useState<PlannerDraft | null>(null);
  const pending = useRef(false),
    writes = useRef(Promise.resolve());
  async function load() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(false);
    try {
      setTours(await getTours());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      pending.current = false;
    }
  }
  useEffect(() => {
    pending.current = true;
    getTours()
      .then(setTours)
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
        pending.current = false;
      });
    AsyncStorage.getItem("azertur.discovery.v1")
      .then((raw) => {
        if (raw) {
          const data = JSON.parse(raw);
          if (["en", "ru", "az"].includes(data.locale)) setLocale(data.locale);
          if (Array.isArray(data.saved))
            setSaved(
              [
                ...new Set<string>(
                  data.saved.filter(
                    (s: unknown) => typeof s === "string" && s.length <= 80,
                  ),
                ),
              ].slice(0, 200),
            );
        }
      })
      .catch(() => setStorageError(true))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    writes.current = writes.current
      .then(() =>
        AsyncStorage.setItem(
          "azertur.discovery.v1",
          JSON.stringify({ locale, saved }),
        ),
      )
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [locale, saved, ready]);
  const t = (en: string, ru: string, az: string) =>
    locale === "az" ? az : locale === "ru" ? ru : en;
  const title = (tour: Tour) =>
    locale === "az"
      ? tour.titleAz
      : locale === "ru"
        ? tour.titleRu
        : tour.titleEn;
  const toggle = (slug: string) =>
    setSaved((s) =>
      s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug].slice(-200),
    );
  return {
    tours,
    planner,
    setPlanner,
    loading,
    error,
    load,
    locale,
    setLocale,
    saved,
    toggle,
    filter,
    setFilter,
    reset: () => setFilter(empty),
    t,
    title,
    storageError,
  };
}
const Context = createContext<ReturnType<typeof useDiscoveryState> | null>(
  null,
);
export function DiscoveryProvider({ children }: PropsWithChildren) {
  return (
    <Context.Provider value={useDiscoveryState()}>{children}</Context.Provider>
  );
}
export function useDiscovery() {
  const value = useContext(Context);
  if (!value) throw Error("Missing discovery provider");
  return value;
}
export function category(tour: Tour): Filter["region"] {
  if (tour.slug.includes("baku")) return "city";
  if (tour.slug.includes("sheki") || tour.slug.includes("gabala"))
    return "culture";
  return "nature";
}
export function matching(tour: Tour, query: string, filter: Filter) {
  const q = query.trim().toLocaleLowerCase();
  return (
    (!q ||
      [tour.titleEn, tour.titleRu, tour.titleAz, tour.region, tour.slug].some(
        (x) => x.toLocaleLowerCase().includes(q),
      )) &&
    (filter.region === "all" || category(tour) === filter.region) &&
    (filter.duration === "all" ||
      (filter.duration === "1"
        ? tour.days === 1
        : filter.duration === "2-3"
          ? tour.days >= 2 && tour.days <= 3
          : tour.days >= 4)) &&
    (filter.max === null || tour.fromPriceEur <= filter.max)
  );
}
