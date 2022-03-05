require("esbuild").build({
  entryPoints: ["src/app.ts"],
  outfile: "app.js",
  bundle: true,
  loader: { ".ts": "ts" }
})
  .then(() => console.log("Build complete"))
  .catch(() => process.exit(1));
