import React from "react";
import Svg, { Path } from "react-native-svg";
import { mapSize, outline } from "../journeys/route-geo";

/** Azerbaijan's outline as an icon, for the Map tab. */
export default function AzIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={(size * mapSize.height) / mapSize.width}
      viewBox={"0 0 " + mapSize.width + " " + mapSize.height}
    >
      <Path d={outline} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
