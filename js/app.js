import { clamp } from './utils.js';
import { renderPortadaFicha, W as W1, H as H1 } from './templates/portadaFicha.js';
import { renderHistoriaColectora9x16, W as W9, H as H9 } from './templates/historiaColectora9x16.js';
import { renderVideoStory9x16, W as WV, H as HV } from './templates/videoStory9x16.js';
import { exportSlideshowMp4 } from './video.js';

const els = {
  model: document.getElementById('model'),
  year: document.getElementById('year'),
  km: document.getElementById('km'),
  version: document.getElementById('version'),
  gearbox: document.getElementById('gearbox'),
  engine: document.getElementById('engine'),
  images: document.getElementById('images'),
  generateBtn: document.getElementById('generateBtn'),
  downloadZipBtn: document.getElementById('downloadZipBtn'),
  previews: document.getElementById('previews'),
  templateSelect: document.getElementById('templateSelect'),
  exportFormat: document.getElementById('exportFormat'),
  jpgQuality: document.getElementById('jpgQuality'),
  jpgQualityWrap: document.getElementById('jpgQualityWrap'),
  videoDuration: document.getElementById('videoDuration'),
  videoDurationWrap: document.getElementById('videoDurationWrap'),
  videoFps: document.getElementById('videoFps'),
  videoFpsWrap: document.getElementById('videoFpsWrap'),
  downloadVideoBtn: document.getElementById('downloadVideoBtn'),
  statusText: document.getElementById('statusText'),
};

/**
 * Portada: { type:'portada', img, transform }
 * Historia: { type:'historia', imgs:{main,bottomLeft,bottomRight}, transforms:{main,bottomLeft,bottomRight}, activeFrame }
 */
let items = [];

// Optional brand assets (logo + whatsapp icon)
const assets = { logo: null, whatsapp: null };
const assetsReady = (async () => {
  try {
    assets.logo = await loadUrlImage('assets/logo.png');
  } catch {}
  try {
    assets.whatsapp = await loadUrlImage('assets/whatsapp.svg');
  } catch {}
})();

function getData(){
  const format = els.exportFormat.value;
  const q = Number(els.jpgQuality.value || 0.92);
  const dur = Number(els.videoDuration?.value || 2.5);
  const fps = Number(els.videoFps?.value || 30);
  return {
    model: els.model.value,
    year: els.year.value,
    km: els.km.value,
    version: els.version.value,
    gearbox: els.gearbox.value,
    engine: els.engine.value,
    __exportFormat: format,
    __exportQuality: q,
    __videoDuration: dur,
    __videoFps: fps,
  };
}

function getTemplate(){
  return els.templateSelect?.value || 'portada';
}

function setStatus(html){
  els.statusText.innerHTML = html;
}

function updateJpgUi(){
  const isJpg = els.exportFormat.value === 'jpg';
  els.jpgQualityWrap.style.display = isJpg ? 'flex' : 'none';
}

function updateVideoUi(){
  const isVideo = getTemplate() === 'video';
  els.videoDurationWrap.style.display = isVideo ? 'flex' : 'none';
  els.videoFpsWrap.style.display = isVideo ? 'flex' : 'none';
  // En video, por defecto conviene PNG para no artefactar el texto
  if (isVideo && els.exportFormat.value !== 'png') {
    els.exportFormat.value = 'png';
    updateJpgUi();
  }
}

els.exportFormat.addEventListener('change', updateJpgUi);
updateJpgUi();
updateVideoUi();

els.templateSelect?.addEventListener('change', ()=>{
  // Reset previews when switching template (different aspect + grouping rules)
  items = [];
  els.previews.innerHTML = '';
  els.downloadZipBtn.disabled = true;
  els.downloadVideoBtn.disabled = true;
  const tpl = getTemplate();
  if (tpl === 'historia'){
    setStatus('Plantilla <strong>Historia 9:16</strong>. Subí <strong>3</strong> fotos por banner y tocá <strong>Generar</strong>.');
  } else if (tpl === 'video') {
    setStatus('Plantilla <strong>Video 9:16</strong>. Subí fotos (1 por slide) y tocá <strong>Generar</strong>. Luego: <strong>Descargar MP4</strong>.');
  } else {
    setStatus('Plantilla <strong>Portada 1:1</strong>. Subí fotos y tocá <strong>Generar</strong>.');
  }
  updateVideoUi();
});

els.images.addEventListener('change', async () => {
  const files = Array.from(els.images.files || []).filter(f=>f.type.startsWith('image/'));
  if (!files.length){
    items = [];
    els.previews.innerHTML = '';
    els.downloadZipBtn.disabled = true;
    els.downloadVideoBtn.disabled = true;
    setStatus('Listo. Subí las fotos y tocá <strong>Generar</strong>.');
    return;
  }
  const tpl = getTemplate();
  if (tpl === 'historia'){
    const groups = Math.floor(files.length / 3);
    const rest = files.length % 3;
    const restMsg = rest ? ` (sobran ${rest} que no se usan)` : '';
    setStatus(`Cargadas <strong>${files.length}</strong> imagen(es). Historia usa <strong>3</strong> por banner → <strong>${groups}</strong> banner(s)${restMsg}. Tocá <strong>Generar</strong>.`);
  } else {
    const msg = tpl === 'video'
      ? `Cargadas <strong>${files.length}</strong> imagen(es). Video usa <strong>1</strong> por slide. Tocá <strong>Generar</strong>.`
      : `Cargadas <strong>${files.length}</strong> imagen(es). Tocá <strong>Generar</strong> para armar las previews.`;
    setStatus(msg);
  }
});

els.generateBtn.addEventListener('click', async () => {
  const files = Array.from(els.images.files || []).filter(f=>f.type.startsWith('image/'));
  if (!files.length){
    setStatus('Subí al menos una imagen.');
    return;
  }

  els.generateBtn.disabled = true;
  els.downloadZipBtn.disabled = true;
  els.downloadVideoBtn.disabled = true;
  els.previews.innerHTML = '';

  const data = getData();
  const tpl = getTemplate();
  await assetsReady;
  setStatus(`Generando previews...`);

  items = [];
  if (tpl === 'historia'){
    const groups = Math.floor(files.length / 3);
    if (!groups){
      setStatus('Para Historia necesitás subir al menos <strong>3</strong> fotos.');
      els.generateBtn.disabled = false;
      return;
    }
    for (let g=0; g<groups; g++){
      const i = g*3;
      const fMain = files[i];
      const fBL = files[i+1];
      const fBR = files[i+2];

      const imgMain = await loadImage(fMain);
      const imgBL = await loadImage(fBL);
      const imgBR = await loadImage(fBR);

      const id = `${Date.now()}_${g}`;
      const name = safeName(fMain.name.replace(/\.[^/.]+$/, ''));

      const card = document.createElement('div');
      card.className = 'preview';

      const canvas = document.createElement('canvas');
      canvas.width = 540;
      canvas.height = 960;
      canvas.style.aspectRatio = '9 / 16';

      const meta = document.createElement('div');
      meta.className = 'meta';

      const left = document.createElement('div');
      left.className = 'left';
      left.innerHTML = `<span class="tag"><span class="dot"></span> Historia 9:16</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">${name}</span>`;

      const right = document.createElement('div');
      right.className = 'right';
      const frames = document.createElement('div');
      frames.className = 'frames';
      frames.innerHTML = `
        <button type="button" data-frame="main" class="active">Main</button>
        <button type="button" data-frame="bottomLeft">Abajo Izq</button>
        <button type="button" data-frame="bottomRight">Abajo Der</button>
      `;
      right.appendChild(frames);

      meta.appendChild(left);
      meta.appendChild(right);

      card.appendChild(canvas);
      card.appendChild(meta);
      els.previews.appendChild(card);

      const item = {
        id,
        type: 'historia',
        files: { main: fMain, bottomLeft: fBL, bottomRight: fBR },
        imgs: { main: imgMain, bottomLeft: imgBL, bottomRight: imgBR },
        transforms: {
          main: { zoom: 1, panX: 0, panY: 0 },
          bottomLeft: { zoom: 1, panX: 0, panY: 0 },
          bottomRight: { zoom: 1, panX: 0, panY: 0 },
        },
        activeFrame: 'main',
        canvas,
        name,
      };
      items.push(item);

      // frame selector
      frames.addEventListener('click', async (e)=>{
        const btn = e.target?.closest('button[data-frame]');
        if (!btn) return;
        item.activeFrame = btn.getAttribute('data-frame');
        for (const b of frames.querySelectorAll('button')) b.classList.remove('active');
        btn.classList.add('active');
      });

      attachPanZoomHandlers(item);
      await renderPreview(item, data);
    }
  } else {
    for (let i=0; i<files.length; i++){
      const file = files[i];
      const img = await loadImage(file);
      const id = `${Date.now()}_${i}`;
      const transform = { zoom: 1, panX: 0, panY: 0 };
      const name = safeName(file.name.replace(/\.[^/.]+$/, ''));

      const card = document.createElement('div');
      card.className = 'preview';

      const canvas = document.createElement('canvas');
      if (tpl === 'video') {
        canvas.width = 540;
        canvas.height = 960;
        canvas.style.aspectRatio = '9 / 16';
      } else {
        canvas.width = 960;
        canvas.height = 960;
        canvas.style.aspectRatio = '1 / 1';
      }

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = tpl === 'video'
        ? `<span class="tag"><span class="dot"></span> Video 9:16</span><span>${name}</span>`
        : `<span class="tag"><span class="dot"></span> Portada</span><span>${name}</span>`;

      card.appendChild(canvas);
      card.appendChild(meta);
      els.previews.appendChild(card);

      const item = tpl === 'video'
        ? { id, type: 'video', file, img, transform, canvas, name }
        : { id, type: 'portada', file, img, transform, canvas, name };
      items.push(item);

      attachPanZoomHandlers(item);
      await renderPreview(item, data);
    }
  }

  els.generateBtn.disabled = false;
  els.downloadZipBtn.disabled = false;
  els.downloadVideoBtn.disabled = (tpl !== 'video');
  setStatus(tpl === 'video'
    ? `Listo. Reencuadrá si querés (arrastrar + rueda) y descargá el <strong>MP4</strong>.`
    : `Listo. Reencuadrá si querés (arrastrar + rueda) y descargá el ZIP.`);
});

els.downloadZipBtn.addEventListener('click', async () => {
  if (!items.length) return;

  els.downloadZipBtn.disabled = true;
  els.generateBtn.disabled = true;

  const zip = new JSZip();
  const data = getData();
  const format = data.__exportFormat;
  const tpl = getTemplate();

  setStatus(`Exportando ${items.length} ${tpl === 'historia' ? 'banner(s)' : 'imagen(es)'} a ZIP...`);

  for (let i=0; i<items.length; i++){
    const it = items[i];
    await assetsReady;
    const ext = format === 'png' ? 'png' : 'jpg';
    if (tpl === 'historia' && it.type === 'historia'){
      const { blob } = await renderHistoriaColectora9x16({ imgs: it.imgs, data, transforms: it.transforms, assets });
      zip.file(`${it.name}_historia.${ext}`, blob);
    } else if (tpl === 'video' && it.type === 'video') {
      const { blob } = await renderVideoStory9x16({ img: it.img, data, transform: it.transform, assets });
      zip.file(`${it.name}_video.${ext}`, blob);
    } else {
      const { blob } = await renderPortadaFicha({ img: it.img, data, transform: it.transform, assets });
      zip.file(`${it.name}_portada.${ext}`, blob);
    }
  }

  const out = await zip.generateAsync({ type: 'blob' });
  const zipName = tpl === 'historia'
    ? 'historias_colectora.zip'
    : (tpl === 'video' ? 'video_frames_colectora.zip' : 'portadas_colectora.zip');
  downloadBlob(out, zipName);

  els.downloadZipBtn.disabled = false;
  els.generateBtn.disabled = false;
  setStatus(`ZIP generado.`);
});

els.downloadVideoBtn.addEventListener('click', async () => {
  if (!items.length) return;
  const tpl = getTemplate();
  if (tpl !== 'video') return;

  els.downloadVideoBtn.disabled = true;
  els.downloadZipBtn.disabled = true;
  els.generateBtn.disabled = true;

  const data = getData();
  const durationSec = data.__videoDuration;
  const fps = data.__videoFps;

  try {
    await assetsReady;
    setStatus('Preparando slides para MP4... (esto corre local y puede tardar dependiendo de tu PC)');

    // Render slides as PNG (best for text)
    const slides = [];
    for (let i=0; i<items.length; i++){
      const it = items[i];
      if (it.type !== 'video') continue;
      // Force png for encoding
      const dataForPng = { ...data, __exportFormat: 'png' };
      const { blob } = await renderVideoStory9x16({ img: it.img, data: dataForPng, transform: it.transform, assets });
      slides.push({ filename: `slide_${String(i).padStart(3,'0')}.png`, blob });
    }

    if (slides.length < 1) {
      setStatus('No hay slides para exportar.');
      return;
    }

    setStatus('Codificando MP4...');
    const { blob: videoBlob } = await exportSlideshowMp4({
      slides,
      durationSec,
      fps,
      onLog: (line)=>{
        // Reduce noise, but keep the last line visible
        if (line && line.includes('frame=')) setStatus(`Codificando MP4...<br><span style="opacity:.75;font-size:12px">${line}</span>`);
      },
    });

    downloadBlob(videoBlob, 'slideshow_9x16.mp4');
    setStatus('MP4 generado.');
  } catch (err) {
    console.error(err);
    setStatus(`Error generando MP4: <strong>${(err?.message || err)}</strong>`);
  } finally {
    els.generateBtn.disabled = false;
    els.downloadZipBtn.disabled = false;
    els.downloadVideoBtn.disabled = false;
  }
});

async function renderPreview(item, data){
  const tpl = getTemplate();
  const { dataURL } = (tpl === 'historia' && item.type === 'historia')
    ? await renderHistoriaColectora9x16({ imgs: item.imgs, data, transforms: item.transforms, assets })
    : (tpl === 'video' && item.type === 'video')
      ? await renderVideoStory9x16({ img: item.img, data, transform: item.transform, assets })
      : await renderPortadaFicha({ img: item.img, data, transform: item.transform, assets });
  const img = await dataUrlToImage(dataURL);
  const ctx = item.canvas.getContext('2d');
  ctx.clearRect(0,0,item.canvas.width,item.canvas.height);
  ctx.drawImage(img, 0,0, item.canvas.width, item.canvas.height);
}

function attachPanZoomHandlers(item){
  const c = item.canvas;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  // pointer drag -> pan
  c.addEventListener('pointerdown', (e)=>{
    dragging = true;
    c.setPointerCapture(e.pointerId);
    lastX = e.clientX;
    lastY = e.clientY;
  });
  c.addEventListener('pointermove', async (e)=>{
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    const tpl = getTemplate();
    const factor = (tpl === 'historia') ? (W9 / c.width) : (tpl === 'video' ? (WV / c.width) : (W1 / c.width));
    if (item.type === 'historia'){
      const t = item.transforms[item.activeFrame];
      t.panX += dx * factor;
      t.panY += dy * factor;
    } else {
      item.transform.panX += dx * factor;
      item.transform.panY += dy * factor;
    }

    await renderPreview(item, getData());
  });
  const end = ()=>{dragging=false;};
  c.addEventListener('pointerup', end);
  c.addEventListener('pointercancel', end);
  c.addEventListener('lostpointercapture', end);

  // wheel -> zoom
  c.addEventListener('wheel', async (e)=>{
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const step = delta > 0 ? -0.08 : 0.08;
    if (item.type === 'historia'){
      const t = item.transforms[item.activeFrame];
      t.zoom = clamp(t.zoom + step, 0.7, 2.6);
    } else {
      item.transform.zoom = clamp(item.transform.zoom + step, 0.7, 2.6);
    }
    await renderPreview(item, getData());
  }, { passive: false });
}

async function loadImage(file){
  // Prefer ImageBitmap (fast)
  if ('createImageBitmap' in window){
    const bmp = await createImageBitmap(file);
    return bmp;
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}

async function loadUrlImage(url){
  const img = new Image();
  img.decoding = 'async';
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  return img;
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeName(s){
  return String(s||'imagen')
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g,'_')
    .replace(/_+/g,'_')
    .replace(/^_|_$/g,'')
    .slice(0, 60) || 'imagen';
}

async function dataUrlToImage(dataURL){
  const img = new Image();
  img.decoding = 'async';
  img.src = dataURL;
  await img.decode();
  return img;
}
