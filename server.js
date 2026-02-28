import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Required for SharedArrayBuffer (ffmpeg.wasm) in modern browsers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  // Helpful for cross-origin assets (CDNs). Many CDNs already send CORS headers;
  // this header is mostly for your own served assets.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use(express.static(__dirname, {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".wasm")) {
      res.setHeader("Content-Type", "application/wasm");
    }
  }
}));

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
app.listen(PORT, () => {
  console.log(`✅ Server listo: http://localhost:${PORT}`);
  console.log("🔎 Tip: en la consola del navegador, window.crossOriginIsolated debe ser true.");
});
