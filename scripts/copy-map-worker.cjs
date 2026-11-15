const fs = require("node:fs");
const path = require("node:path");

const root = path.dirname(require.resolve("maplibre-gl/package.json"));
const destination = path.resolve("public/maplibre");
fs.mkdirSync(destination, { recursive: true });
const worker = "maplibre-gl-worker.mjs";
fs.copyFileSync(path.join(root, "dist", worker), path.join(destination, worker));
