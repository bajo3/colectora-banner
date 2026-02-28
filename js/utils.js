export function upper(v){return String(v||'').trim().toUpperCase();}
export function cleanSpaces(v){return String(v||'').replace(/\s+/g,' ').trim();}
export function formatKm(km){
  const n = Number(km);
  if(!Number.isFinite(n) || n<=0) return '';
  // 165000 -> 165.000
  const s = Math.round(n).toString();
  const parts=[];
  for(let i=s.length;i>0;i-=3){parts.unshift(s.slice(Math.max(0,i-3),i));}
  return parts.join('.');
}
export function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
