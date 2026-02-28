import { drawCoverPanZoom, drawContainPanZoom, fitText, roundRect } from '../draw.js';
import { cleanSpaces, formatKm } from '../utils.js';

export const W = 1080;
export const H = 1920;

const FUCHSIA_LINE = 'rgba(214, 0, 110, 0.70)';

/**
 * Historia 9:16 (3 fotos) - Jesús Díaz Automotores Colectora
 * imgs: { main, bottomLeft, bottomRight }
 * transforms: { main, bottomLeft, bottomRight } each { zoom, panX, panY }
 */
export function drawHistoriaColectora9x16(ctx, imgs, data, transforms, assets={}){
  const mainImg = imgs?.main;
  const blImg = imgs?.bottomLeft;
  const brImg = imgs?.bottomRight;

  const tMain = transforms?.main || { zoom: 1, panX: 0, panY: 0 };
  const tBL = transforms?.bottomLeft || { zoom: 1, panX: 0, panY: 0 };
  const tBR = transforms?.bottomRight || { zoom: 1, panX: 0, panY: 0 };

  // Layout (px)
  const topH = 1050;
  const infoH = 520;
  const bottomPhotosH = 250;
  const footerH = 100;
  const infoY = topH;
  const bottomY = topH + infoH;
  const footerY = H - footerH;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Top photo
  // For 9:16 stories with landscape sources, we draw:
  // 1) a blurred "cover" background (fills the area)
  // 2) the main image in "contain" mode (so it doesn't get overly cropped)
  if (mainImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, topH);
    ctx.clip();

    // Blurred background (cover)
    ctx.save();
    ctx.filter = 'blur(18px)';
    ctx.globalAlpha = 0.90;
    drawCoverPanZoom(ctx, mainImg, 0, 0, W, topH, { zoom: 1, panX: 0, panY: 0 });
    ctx.restore();

    // Subtle darken to keep it premium and avoid bright edges
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, 0, W, topH);
    ctx.restore();

    // Foreground (contain + editable pan/zoom)
    ctx.save();
    ctx.globalAlpha = 1;
    drawContainPanZoom(ctx, mainImg, 0, 0, W, topH, tMain);
    ctx.restore();

    ctx.restore();
  }

  // Info block (soft gray)
  const g = ctx.createLinearGradient(0, infoY, 0, infoY + infoH);
  g.addColorStop(0, '#f4f4f7');
  g.addColorStop(1, '#f0f0f4');
  ctx.fillStyle = g;
  ctx.fillRect(0, infoY, W, infoH);

  // Thin fuchsia lines (top/bottom of info section)
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

  // Text content (centered)
  const model = cleanSpaces(String(data?.model || ''));
  const year = String(data?.year || '').trim();
  const km = formatKm(data?.km);
  const version = cleanSpaces(String(data?.version || ''));
  const gearbox = cleanSpaces(String(data?.gearbox || ''));

  const yearKm = [year, km ? `${km} km` : ''].filter(Boolean).join(' • ');

  const cx = W / 2;
  let y = infoY + 185;

  // Model (H1)
  ctx.save();
  const modelSize = fitText(ctx, model || ' ', W - 160, 120, 64, 'system-ui', '900');
  ctx.font = `900 ${modelSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillStyle = '#111216';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(model || ' ', cx, y);
  ctx.restore();
  y += 92;

  // Year · KM (H2)
  ctx.save();
  ctx.font = '700 68px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#1b1c22';
  ctx.globalAlpha = 0.90;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(yearKm || ' ', cx, y);
  ctx.restore();
  y += 84;

  // Version (H3)
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

  // Gearbox (Body)
  ctx.save();
  ctx.font = '650 56px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#2a2b33';
  ctx.globalAlpha = 0.80;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(gearbox ? `Caja: ${gearbox}` : ' ', cx, y);
  ctx.restore();

  // Bottom photos
  const padX = 40;
  const gap = 18;
  const by = bottomY;
  const bw = (W - padX * 2 - gap) / 2;
  const bh = bottomPhotosH;

  // background for bottom area (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, by, W, bottomPhotosH + footerH);

  // frames
  const frameR = 12;
  const drawFrame = (x, img, t) => {
    ctx.save();
    roundRect(ctx, x, by, bw, bh, frameR);
    ctx.clip();
    if (img) drawCoverPanZoom(ctx, img, x, by, bw, bh, t);
    ctx.restore();

    // subtle border
    ctx.save();
    roundRect(ctx, x + 0.5, by + 0.5, bw - 1, bh - 1, frameR);
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  drawFrame(padX, blImg, tBL);
  drawFrame(padX + bw + gap, brImg, tBR);

  // Footer logo
  const logo = assets.logo;
  if (logo) {
    const maxW = W * 0.78;
    const maxH = footerH * 0.80;
    const iw = logo.width || logo.naturalWidth || 1;
    const ih = logo.height || logo.naturalHeight || 1;
    const s = Math.min(maxW / iw, maxH / ih);
    const dw = iw * s;
    const dh = ih * s;
    const dx = (W - dw) / 2;
    const dy = footerY + (footerH - dh) / 2;
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.drawImage(logo, dx, dy, dw, dh);
    ctx.restore();
  }
}

export async function renderHistoriaColectora9x16({ imgs, data, transforms, assets }){
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  drawHistoriaColectora9x16(ctx, imgs, data, transforms, assets);

  const format = data?.__exportFormat || 'jpg';
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';

  const blob = await new Promise((resolve)=> canvas.toBlob(resolve, mime, mime==='image/jpeg'?quality:undefined));
  const dataURL = canvas.toDataURL(mime, mime==='image/jpeg'?quality:undefined);
  return { blob, dataURL, width: W, height: H };
}
