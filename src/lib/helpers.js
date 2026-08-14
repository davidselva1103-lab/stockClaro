export const CAT_PALETTE = ['#0F6659', '#6C5CE7', '#B8546E', '#2D6CDF', '#B7791F', '#3E8E7E', '#8D5FB0', '#4C7A3F', '#A8446B', '#3E6C8E'];
export const UNIDADES = ['unidad', 'caja', 'kg', 'g', 'litro', 'ml', 'paquete', 'par', 'otro'];
export const PAGE_SIZE = 25;

export const C = {
  bg: '#F2F5F3', surface: '#FFFFFF', ink: '#132420', inkSoft: '#5C6B67', border: '#DEE6E2',
  brand: '#0F6659', brandDark: '#0B4A41', brandSoft: '#E4F0EC',
  ok: '#1F9D6C', okBg: '#E7F6EE', warn: '#C9821E', warnBg: '#FBF0DD', danger: '#C24141', dangerBg: '#FBEAEA',
};

export function colorForCategory(name, categories) {
  const found = categories.find(c => c.name === name);
  if (found) return found.color;
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CAT_PALETTE[Math.abs(h) % CAT_PALETTE.length];
}
export function stockStatus(p) {
  if (p.stock <= 0) return 'agotado';
  if (p.stock <= p.stock_minimo) return 'bajo';
  return 'ok';
}
export const STATUS_META = {
  agotado: { label: 'Agotado', color: C.danger, bg: C.dangerBg },
  bajo: { label: 'Stock bajo', color: C.warn, bg: C.warnBg },
  ok: { label: 'Stock OK', color: C.ok, bg: C.okBg },
};
export function fmtNum(n) { return (Number(n) || 0).toLocaleString('es-NI', { maximumFractionDigits: 2 }); }
export function fmtDate(d) { return new Date(d).toLocaleString('es-NI', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
