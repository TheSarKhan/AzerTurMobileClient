const fs = require("node:fs");
const path = require("node:path");
const root = path.dirname(require.resolve("pdfjs-dist/package.json"));
fs.mkdirSync(path.resolve("public"), { recursive: true });
fs.copyFileSync(
  path.join(root, "build/pdf.worker.min.mjs"),
  path.resolve("public/pdf.worker.min.mjs"),
);
