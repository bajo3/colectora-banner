import { clamp } from './utils.js';

// Cover draw with pan/zoom (no deformation)
// transform: { zoom: 1, panX: 0, panY: 0 } in pixels at output resolution
export function drawCoverPanZoom(ctx, img, x, y, w, h, transform={zoom:1,panX:0,panY:0}){
  const iw = img.width;
  const ih = img.height;
  const base = Math.max(w/iw, h/ih);
  const zoom = clamp(Number(transform.zoom||1), 0.6, 3);
  const scale = base * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w/2 + Number(transform.panX||0);
  const cy = y + h/2 + Number(transform.panY||0);
  const dx = cx - dw/2;
  const dy = cy - dh/2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Contain draw with pan/zoom (keeps the entire image visible at zoom=1)
// Useful for portrait layouts when the source image is landscape.
export function drawContainPanZoom(ctx, img, x, y, w, h, transform={zoom:1,panX:0,panY:0}){
  const iw = img.width;
  const ih = img.height;
  const base = Math.min(w/iw, h/ih);
  const zoom = clamp(Number(transform.zoom||1), 0.6, 3);
  const scale = base * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w/2 + Number(transform.panX||0);
  const cy = y + h/2 + Number(transform.panY||0);
  const dx = cx - dw/2;
  const dy = cy - dh/2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function textStrokeFill(ctx, text, x, y, opts){
  const {
    font='700 48px system-ui',
    fill='#fff',
    stroke='rgba(0,0,0,.85)',
    lineWidth=8,
    align='center',
    baseline='alphabetic',
    shadowColor='rgba(0,0,0,.35)',
    shadowBlur=16,
    shadowOffsetY=6,
  } = opts || {};

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Find largest font size within [min,max] that fits maxWidth
export function fitText(ctx, text, maxWidth, maxSize, minSize, family='system-ui', weight='900'){
  const t = String(text||'');
  let hi = maxSize;
  let lo = minSize;
  let best = minSize;
  while (lo <= hi){
    const mid = Math.floor((lo+hi)/2);
    ctx.font = `${weight} ${mid}px ${family}`;
    const w = ctx.measureText(t).width;
    if (w <= maxWidth){
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

// Sample luminance average on a rectangle (0..1)
export function avgLuminance(ctx, x, y, w, h){
  const ix = Math.max(0, Math.floor(x));
  const iy = Math.max(0, Math.floor(y));
  const iw = Math.max(1, Math.floor(w));
  const ih = Math.max(1, Math.floor(h));
  let data;
  try {
    data = ctx.getImageData(ix, iy, iw, ih).data;
  } catch {
    return 0.4;
  }
  let sum = 0;
  const step = 16; // sample every 4 pixels (RGBA)
  for (let i=0; i<data.length; i += step){
    const r = data[i] / 255;
    const g = data[i+1] / 255;
    const b = data[i+2] / 255;
    // relative luminance
    sum += 0.2126*r + 0.7152*g + 0.0722*b;
  }
  const samples = Math.max(1, Math.floor(data.length/step));
  return sum / samples;
}

export function roundRect(ctx, x, y, w, h, r){
  const radius = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
