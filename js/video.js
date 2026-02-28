// Export MP4 slideshow locally with ffmpeg.wasm.
// Requires (in index.html):
//   <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"></script>
//
// Notes:
// - @ffmpeg/ffmpeg v0.12+ changed the API (FFmpeg class / exec / writeFile...).
//   This project uses v0.11.x to keep a vanilla, global-script integration.
// - In v0.11.x you MUST set corePath, otherwise it will try to load
//   /ffmpeg-core.js from your own server (and it will fail on Live Server).

let ffmpegInstance = null;
let ffmpegLoading = null;

// Pin the matching core bundle for v0.11.x (single-thread core).
const CORE_PATH = "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js";

function getFfmpegApi() {
  const api = window?.FFmpeg;
  if (!api?.createFFmpeg || !api?.fetchFile) {
    throw new Error(
      "FFmpeg wasm no está disponible (no cargó el script de @ffmpeg/ffmpeg)"
    );
  }
  return api;
}

export async function ensureFfmpeg({ onLog, onProgress } = {}) {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { createFFmpeg } = getFfmpegApi();
    const ffmpeg = createFFmpeg({
      log: true,
      corePath: CORE_PATH,
    });

    // Optional: surface logs/progress to UI
    try {
      ffmpeg.setLogger(({ message }) => {
        if (message) onLog?.(message);
      });
    } catch {}
    try {
      ffmpeg.setProgress((p) => onProgress?.(p));
    } catch {}

    await ffmpeg.load();
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

export async function exportSlideshowMp4({
  slides, // [{ filename, blob }]
  durationSec = 2.5,
  fps = 30,
  onProgress,
  onLog,
}) {
  const ffmpeg = await ensureFfmpeg({ onLog, onProgress });

  const { fetchFile } = getFfmpegApi();
  const safeDuration = Math.max(0.5, Number(durationSec) || 2.5);
  const safeFps = Math.max(12, Math.min(60, Number(fps) || 30));

  // Cleanup FS from previous runs (best-effort)
  const cleanup = (name) => {
    try {
      ffmpeg.FS("unlink", name);
    } catch {}
  };
  cleanup("list.txt");
  cleanup("out.mp4");
  for (const s of slides) cleanup(s.filename);

  // Write inputs
  for (const s of slides) {
    ffmpeg.FS("writeFile", s.filename, await fetchFile(s.blob));
  }

  // Concat list with per-file durations.
  // Trick: duplicate last file so it also gets its duration.
  let list = "";
  for (const s of slides) {
    list += `file '${s.filename}'\n`;
    list += `duration ${safeDuration}\n`;
  }
  const last = slides[slides.length - 1];
  list += `file '${last.filename}'\n`;

  ffmpeg.FS("writeFile", "list.txt", new TextEncoder().encode(list));

  // Concat demuxer (hard cuts). If you want fades/xfade, we can add v2.
  const args = [
    "-y",
    "-r",
    String(safeFps),
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "list.txt",
    "-vf",
    `fps=${safeFps},format=yuv420p`,
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "out.mp4",
  ];

  onProgress?.({ stage: "encoding" });
  await ffmpeg.run(...args);

  const out = ffmpeg.FS("readFile", "out.mp4");
  const blob = new Blob([out.buffer], { type: "video/mp4" });
  return { blob };
}
