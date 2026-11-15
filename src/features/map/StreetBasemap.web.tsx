import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { StreetBasemapProps } from "./StreetBasemap";

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

function styleForAzTrip(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      if (layer.type === "background")
        return { ...layer, paint: { ...layer.paint, "background-color": "#f5f4ef" } };
      if (layer.type === "fill") {
        const color = layer.id.startsWith("water") ? "#b3d9ed"
          : layer.id.startsWith("landcover-wood") || layer.id.startsWith("landcover-grass") || layer.id === "park" ? "#d8ead4"
          : layer.id.startsWith("building") ? "#dedcd4"
          : layer.id.startsWith("landuse-") ? "#eeede7"
          : undefined;
        if (color) return { ...layer, paint: { ...layer.paint, "fill-color": color } };
      }
      if (layer.type === "line" && /^(highway|bridge)-/.test(layer.id) && !layer.id.includes("path")) {
        const major = /primary|trunk|motorway/.test(layer.id);
        const color = layer.id.endsWith("-casing") ? (major ? "#e5bf69" : "#dedbd2")
          : major ? "#f9df9e" : "#fffdfa";
        return { ...layer, paint: { ...layer.paint, "line-color": color } };
      }
      if (layer.type === "symbol" && (/^poi_r|^road_oneway|^highway-shield/.test(layer.id))) {
        return { ...layer, layout: { ...layer.layout, visibility: "none" } };
      }
      return layer;
    }),
  };
}

export function StreetBasemap({ latitude, longitude, zoom, onReady }: StreetBasemapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const initialView = useRef({ center: [longitude, latitude] as [number, number], zoom });

  useEffect(() => {
    const controller = new AbortController();
    let instance: MapLibreMap | undefined;
    let observer: ResizeObserver | undefined;
    async function initialize() {
      const [maplibre, response] = await Promise.all([
        import("maplibre-gl"),
        fetch(STYLE_URL, { signal: controller.signal }),
      ]);
      if (!response.ok) throw Error("Street map style unavailable");
      const style = styleForAzTrip(await response.json());
      if (controller.signal.aborted || !container.current) return;
      const element = container.current;
      maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const view = new maplibre.Map({
        container: element, style, ...initialView.current,
        interactive: false, attributionControl: false, renderWorldCopies: false,
      });
      instance = view;
      view.getCanvas().style.position = "absolute";
      view.getCanvas().style.inset = "0";
      view.once("load", () => onReady(true));
      observer = new ResizeObserver(() => view.resize());
      observer.observe(element);
      setMap(view);
    }
    void initialize().catch(() => { if (!controller.signal.aborted) onReady(false); });
    return () => {
      controller.abort();
      observer?.disconnect();
      instance?.remove();
      onReady(false);
    };
  }, [onReady]);

  useEffect(() => {
    map?.jumpTo({ center: [longitude, latitude], zoom });
  }, [map, latitude, longitude, zoom]);

  return <div ref={container} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
}
