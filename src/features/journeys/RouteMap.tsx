import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Polygon, Text as SvgText } from "react-native-svg";
import { cityPoints, outline } from "./route-geo";
import type { RouteStop } from "./route";

// The whole country, with a small margin.
const view = { x: -6, y: -6, width: 412, height: 338 };
const anchor: Record<
  string,
  { dx: number; dy: number; align: "start" | "end" | "middle" }
> = {
  Baku: { dx: -14, dy: 4, align: "end" },
  Quba: { dx: 13, dy: -9, align: "start" },
  Khinalug: { dx: 13, dy: 5, align: "start" },
  Gabala: { dx: 0, dy: 24, align: "middle" },
  Sheki: { dx: 0, dy: -14, align: "middle" },
};

/** The route drawn over Azerbaijan: numbered stops joined by arrows in travel order. */
export function RouteMap({
  stops,
  name,
  label,
}: {
  stops: RouteStop[];
  name: (city: string) => string;
  label: string;
}) {
  const order = new Map<string, number[]>();
  stops.forEach((s, i) =>
    order.set(s.city, [...(order.get(s.city) || []), i + 1]),
  );
  const legs = stops
    .slice(1)
    .map((s, i) => ({ from: stops[i].city, to: s.city, i }));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{
        width: "100%",
        aspectRatio: view.width / view.height,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F3F4EE",
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      >
        <Path d={outline} fill="#E3E8DA" stroke="#CBD3C3" strokeWidth={1} />
        {Object.entries(cityPoints).map(([city, p]) => (
          <React.Fragment key={city}>
            {!order.has(city) && (
              <Circle cx={p.x} cy={p.y} r={3} fill="#A9B3A5" />
            )}
            <SvgText
              fontFamily="Inter"
              x={p.x + anchor[city].dx}
              y={p.y + anchor[city].dy}
              textAnchor={anchor[city].align}
              fontSize={11}
              fontWeight={order.has(city) ? "700" : "400"}
              fill={order.has(city) ? "#173D30" : "#7B857A"}
            >
              {name(city)}
            </SvgText>
          </React.Fragment>
        ))}
        {legs.map(({ from, to, i }) => {
          const a = cityPoints[from],
            b = cityPoints[to];
          const dx = b.x - a.x,
            dy = b.y - a.y,
            len = Math.hypot(dx, dy) || 1;
          // Stop short of both dots; bow alternate legs so out-and-back trips stay readable.
          const sx = a.x + (dx / len) * 9,
            sy = a.y + (dy / len) * 9,
            ex = b.x - (dx / len) * 11,
            ey = b.y - (dy / len) * 11,
            bow = (i % 2 ? -1 : 1) * Math.min(16, len / 5),
            cx = (sx + ex) / 2 - (dy / len) * bow,
            cy = (sy + ey) / 2 + (dx / len) * bow;
          // Arrowhead along the curve's end tangent.
          const tx = ex - cx,
            ty = ey - cy,
            tl = Math.hypot(tx, ty) || 1,
            ux = tx / tl,
            uy = ty / tl,
            head = `${ex},${ey} ${ex - ux * 8 - uy * 4},${ey - uy * 8 + ux * 4} ${ex - ux * 8 + uy * 4},${ey - uy * 8 - ux * 4}`;
          return (
            <React.Fragment key={i}>
              <Path
                d={`M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`}
                fill="none"
                stroke="#BD5632"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              <Polygon points={head} fill="#BD5632" />
            </React.Fragment>
          );
        })}
        {[...order.entries()].map(([city, n]) => {
          const p = cityPoints[city];
          const text = n.join("·");
          return (
            <React.Fragment key={city}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={text.length > 1 ? 10 : 8}
                fill="#BD5632"
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
              <SvgText
                fontFamily="Inter"
                x={p.x}
                y={p.y + 3.6}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight="700"
                fill="#FFFFFF"
              >
                {text}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
