import { useEffect, useState } from "react";
import { getFacets, type Facets } from "./api";
import { quickRange, type Quick } from "./ranges";

export type WhenTotals = Record<Quick, number>;

/**
 * Which filter chips are worth showing. The type and city counts follow the date, search text and
 * the other chip picked; the date counts follow the type, city and search text picked.
 */
export function useEventFacets(
  when: Quick,
  category: string,
  city: string,
  text = "",
) {
  const [state, setState] = useState<{
    facets: Facets | null;
    whenTotals: WhenTotals | null;
  }>({ facets: null, whenTotals: null });
  useEffect(() => {
    let live = true;
    const query = (kind: Quick) => {
      const q = new URLSearchParams();
      const range = quickRange(kind);
      if (range) {
        q.set("from", range.from);
        q.set("to", range.to);
      }
      if (category) q.set("category", category);
      if (city) q.set("city", city);
      if (text.trim()) q.set("q", text.trim());
      return q;
    };
    const kinds: Quick[] = ["any", "today", "weekend", "week"];
    Promise.all(kinds.map((k) => getFacets(query(k))))
      .then((all) => {
        if (!live) return;
        const current = all[kinds.indexOf(when)];
        setState({
          facets: current,
          whenTotals: {
            any: all[0].total,
            today: all[1].total,
            weekend: all[2].total,
            week: all[3].total,
          },
        });
      })
      .catch(() => live && setState({ facets: null, whenTotals: null }));
    return () => {
      live = false;
    };
  }, [when, category, city, text]);
  return state;
}
