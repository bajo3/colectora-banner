import { drawCoverPanZoom, fitText, roundRect } from '../draw.js';
import { upper, cleanSpaces, formatKm } from '../utils.js';

export const W = 1080;
export const H = 1080;

const FUCHSIA = 'rgba(214, 0, 110, 0.92)';
const FUCHSIA_LINE = 'rgba(214, 0, 110, 0.85)';

const BRAND_TOP = 'JESÚS DÍAZ AUTOMOTORES';
const BRAND_SUB = 'COLECTORA';

const ADDRESS = 'Colectora Macaya esq. Mejico';
const PHONE = '2494 630646';

export function drawPortadaFicha(ctx, img, data, transform={zoom:1,panX:0,panY:0}, assets={}){
  // photo
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);
  drawCoverPanZoom(ctx, img, 0,0,W,H, transform);

  // vignette + central fade for legibility
  const v = ctx.createRadialGradient(W/2, H*0.42, 120, W/2, H*0.55, 740);
  v.addColorStop(0, 'rgba(0,0,0,0.10)');
  v.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0,0,W,H);


  // center glass card
  const cardW = W*0.78;
  const cardH = 380;
  const cardX = (W-cardW)/2;
  const cardY = H*0.50;
  const cardYTop = cardY - cardH/2;

  // backdrop
  roundRect(ctx, cardX, cardYTop, cardW, cardH, 28);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.56)';
  ctx.fill();
  // subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const model = cleanSpaces(upper(data.model || ''));
  const year = String(data.year || '').trim();
  const km = formatKm(data.km);
  const version = cleanSpaces(upper(data.version || ''));
  const gearbox = cleanSpaces(upper(data.gearbox || ''));
  const engine = cleanSpaces(upper(data.engine || ''));

  let y = cardYTop + 84;

  // model
  const modelSize = fitText(ctx, model || ' ', cardW - 90, 78, 44, 'system-ui', '900');
  ctx.save();
  ctx.font = `900 ${modelSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(model || ' ', W/2, y);
  ctx.restore();
  y += 64;

  // year · km
  const line2 = [year, km ? `${km} KM` : ''].filter(Boolean).join(' · ');
  ctx.save();
  ctx.font = '700 40px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 0.95;
  ctx.fillText(line2 || ' ', W/2, y);
  ctx.restore();
  y += 56;

  // version
  ctx.save();
  ctx.font = '700 36px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(version || ' ', W/2, y);
  ctx.restore();
  y += 44;

  // gearbox / engine
  const line4 = [gearbox ? `Caja: ${gearbox}` : '', engine ? engine : ''].filter(Boolean).join(' · ');
  ctx.save();
  ctx.font = '650 34px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(line4 || ' ', W/2, y);
  ctx.restore();

  // logo inside the center card (bottom)
  const logo = assets.logo;
  if (logo) {
    const pad = 22;
    const maxW = cardW - pad * 2;
    const maxH = 92;
    const iw = logo.width || logo.naturalWidth || 1;
    const ih = logo.height || logo.naturalHeight || 1;
    const s = Math.min(maxW / iw, maxH / ih);
    const dw = iw * s;
    const dh = ih * s;
    const dx = cardX + (cardW - dw) / 2;
    const dy = cardYTop + cardH - dh - 18;
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(logo, dx, dy, dw, dh);
    ctx.restore();
  }

  // footer bar
  const barH = 68;
  const barY = H - barH;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, barY, W, barH);

  // subtle top accent
  ctx.fillStyle = 'rgba(214, 0, 110, 0.22)';
  ctx.fillRect(0, barY, W, 3);

  ctx.font = '650 26px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'left';
  ctx.fillText(ADDRESS, 24, barY + barH/2);
  // whatsapp icon + phone (right)
  const wa = assets.whatsapp;
  const rightPad = 24;
  const iconSize = 30;
  const iconGap = 10;

  ctx.textAlign = 'right';
  const phoneX = W - rightPad;
  ctx.fillText(PHONE, phoneX, barY + barH/2);

  if (wa) {
    // estimate phone text width for icon placement
    const wPhone = ctx.measureText(PHONE).width;
    const iconX = phoneX - wPhone - iconGap - iconSize;
    const iconY = barY + (barH - iconSize) / 2;
    ctx.drawImage(wa, iconX, iconY, iconSize, iconSize);
  }

  ctx.restore();
}

export async function renderPortadaFicha({ img, data, transform, assets }){
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawPortadaFicha(ctx, img, data, transform, assets);

  const format = data?.__exportFormat || 'jpg';
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';

  const blob = await new Promise((resolve)=> canvas.toBlob(resolve, mime, mime==='image/jpeg'?quality:undefined));
  const dataURL = canvas.toDataURL(mime, mime==='image/jpeg'?quality:undefined);
  return { blob, dataURL, width: W, height: H };
}
