import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { CSP } from "./src/lib/csp";

const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

const require = createRequire(import.meta.url);
const ortDist = path.dirname(require.resolve("@huggingface/transformers"));
const wasmFiles = ["ort-wasm-simd-threaded.jsep.wasm", "ort-wasm-simd-threaded.jsep.mjs"] as const;

/** Serve ORT wasm from this origin so CSP does not need jsDelivr. */
function ortWasmPlugin(): Plugin {
  return {
    name: "ort-wasm",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/wasm/")) return next();
        const name = url.slice("/wasm/".length);
        if (!wasmFiles.includes(name as (typeof wasmFiles)[number])) return next();
        const file = path.join(ortDist, name);
        res.setHeader("Content-Type", name.endsWith(".wasm") ? "application/wasm" : "text/javascript");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        fs.createReadStream(file).pipe(res);
      });
    },
    generateBundle(_, bundle) {
      for (const name of wasmFiles) {
        this.emitFile({
          type: "asset",
          fileName: `wasm/${name}`,
          source: new Uint8Array(fs.readFileSync(path.join(ortDist, name))),
        });
      }
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith(".wasm") && fileName.startsWith("assets/")) {
          delete bundle[fileName];
        }
      }
    },
  };
}

function cspPlugin(): Plugin {
  return {
    name: "csp-meta",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (ctx.server) return html;
        return html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
      },
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), ortWasmPlugin(), cspPlugin()],
  worker: { format: "es" },
  optimizeDeps: {
    exclude: ["@huggingface/transformers", "onnxruntime-node"],
  },
  server: {
    fs: { allow: [path.resolve(import.meta.dirname, "../..")] },
    headers: isolationHeaders,
  },
  preview: {
    headers: isolationHeaders,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
