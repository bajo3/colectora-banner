import { drawCoverPanZoom, drawContainPanZoom, fitText } from '../draw.js';
import { cleanSpaces, formatKm } from '../utils.js';

export const W = 1080;
export const H = 1920;

const FUCHSIA_LINE = 'rgba(214, 0, 110, 0.70)';
const ADDRESS = 'Colectora Macaya esq. Mejico';
const PHONE = '2494 630646';

/**
 * Video Story 9:16 (1 foto por slide)
 * - Diseñado para ser usado como frame en un slideshow.
 * - Maneja fuentes 16:9 con fondo blur + imagen en contain (editable con pan/zoom).
 */
export function drawVideoStory9x16(ctx, img, data, transform={ zoom: 1, panX: 0, panY: 0 }, assets={}){
  // Layout (px)
  const topH = 1180;
  const infoH = 520;
  const footerH = H - topH - infoH;
  const infoY = topH;
  const footerY = H - footerH;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Top photo area
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, topH);
    ctx.clip();

    // Blurred background (cover)
    ctx.save();
    ctx.filter = 'blur(18px)';
    ctx.globalAlpha = 0.92;
    drawCoverPanZoom(ctx, img, 0, 0, W, topH, { zoom: 1, panX: 0, panY: 0 });
    ctx.restore();

    // Subtle darken
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, 0, W, topH);
    ctx.restore();

    // Foreground image (contain + editable pan/zoom)
    ctx.save();
    drawContainPanZoom(ctx, img, 0, 0, W, topH, transform);
    ctx.restore();

    // Soft vignette for premium look
    const v = ctx.createRadialGradient(W/2, topH*0.45, 120, W/2, topH*0.60, 760);
    v.addColorStop(0, 'rgba(0,0,0,0.00)');
    v.addColorStop(0.60, 'rgba(0,0,0,0.12)');
    v.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, topH);

    ctx.restore();
  }

  // Info block (soft gray)
  const g = ctx.createLinearGradient(0, infoY, 0, infoY + infoH);
  g.addColorStop(0, '#f4f4f7');
  g.addColorStop(1, '#f0f0f4');
  ctx.fillStyle = g;
  ctx.fillRect(0, infoY, W, infoH);

  // Thin fuchsia lines
  const linePad = 90;
  const lineY1 = infoY + 78;
  const lineY2 = infoY + infoH - 78;
  ctx.save();
  ctx.strokeStyle = FUCHSIA_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(linePad, lineY1);
  ctx.lineTo(W - linePad, lineY1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(linePad, lineY2);
  ctx.lineTo(W - linePad, lineY2);
  ctx.stroke();
  ctx.restore();

  const model = cleanSpaces(String(data?.model || ''));
  const year = String(data?.year || '').trim();
  const km = formatKm(data?.km);
  const version = cleanSpaces(String(data?.version || ''));
  const gearbox = cleanSpaces(String(data?.gearbox || ''));

  const yearKm = [year, km ? `${km} km` : ''].filter(Boolean).join(' • ');

  const cx = W / 2;
  let y = infoY + 185;

  // Model
  ctx.save();
  const modelSize = fitText(ctx, model || ' ', W - 160, 120, 64, 'system-ui', '900');
  ctx.font = `900 ${modelSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillStyle = '#111216';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(model || ' ', cx, y);
  ctx.restore();
  y += 92;

  // Year · KM
  ctx.save();
  ctx.font = '700 68px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#1b1c22';
  ctx.globalAlpha = 0.90;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(yearKm || ' ', cx, y);
  ctx.restore();
  y += 84;

  // Version
  ctx.save();
  const versionSize = fitText(ctx, version || ' ', W - 200, 64, 40, 'system-ui', '650');
  ctx.font = `650 ${versionSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillStyle = '#2a2b33';
  ctx.globalAlpha = 0.88;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(version || ' ', cx, y);
  ctx.restore();
  y += 76;

  // Gearbox
  ctx.save();
  ctx.font = '650 56px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#2a2b33';
  ctx.globalAlpha = 0.80;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(gearbox ? `Caja: ${gearbox}` : ' ', cx, y);
  ctx.restore();

  // Footer (contact + logo)
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, footerY, W, footerH);
  // subtle accent
  ctx.fillStyle = 'rgba(214, 0, 110, 0.22)';
  ctx.fillRect(0, footerY, W, 3);

  // logo centered (top of footer)
  const logo = assets.logo;
  if (logo) {
    const maxW = W * 0.78;
    const maxH = footerH * 0.48;
    const iw = logo.width || logo.naturalWidth || 1;
    const ih = logo.height || logo.naturalHeight || 1;
    const s = Math.min(maxW / iw, maxH / ih);
    const dw = iw * s;
    const dh = ih * s;
    const dx = (W - dw) / 2;
    const dy = footerY + 16;
    ctx.globalAlpha = 0.98;
    ctx.drawImage(logo, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }

  // address + phone
  ctx.font = '650 34px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 0.92;
  ctx.fillText(ADDRESS, W/2, footerY + footerH - 74);
  ctx.globalAlpha = 0.98;
  ctx.fillText(PHONE, W/2, footerY + footerH - 30);

  ctx.restore();
}

export async function renderVideoStory9x16({ img, data, transform, assets }){
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  drawVideoStory9x16(ctx, img, data, transform, assets);

  // Para video conviene PNG (sin artefactos), pero respetamos formato si lo piden.
  const format = data?.__exportFormat || 'png';
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

  const blob = await new Promise((resolve)=> canvas.toBlob(resolve, mime, mime==='image/jpeg'?quality:undefined));
  const dataURL = canvas.toDataURL(mime, mime==='image/jpeg'?quality:undefined);
  return { blob, dataURL, width: W, height: H };
}
