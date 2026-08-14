import React from 'react';
import { X, Check, AlertTriangle, ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle, Info } from 'lucide-react';
import { C, STATUS_META, stockStatus, fmtNum, fmtDate, PAGE_SIZE } from './lib/helpers.js';

export const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14, color: C.ink, background: '#FBFCFC', outline: 'none' };
export const primaryBtn = { background: C.brand, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
export const secondaryBtn = { background: '#fff', color: C.ink, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
export const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft, padding: 5, borderRadius: 6 };

export function Badge({ children, color, bg, style }) {
  return <span style={{ background: bg, color, fontWeight: 600, fontSize: 12, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap', ...style }}>{children}</span>;
}

export function StockGauge({ p }) {
  const status = stockStatus(p);
  const meta = STATUS_META[status];
  const max = Math.max(p.stock_minimo * 3, p.stock, 1);
  const pct = Math.min(100, Math.round((p.stock / max) * 100));
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 120 }}>
      <div style={{ width: 64, height: 7, borderRadius: 999, background: '#E7EBE9', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: pct + '%', height: '100%', background: meta.color, borderRadius: 999, transition: 'width .3s' }} />
      </div>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 600, color: C.ink }}>{fmtNum(p.stock)}</span>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: isErr ? C.danger : C.brandDark, color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.18)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: '90vw' }}>
      {isErr ? <AlertTriangle size={16} /> : <Check size={16} />} {toast.message}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(19,36,32,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: C.surface, borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.surface, borderRadius: '16px 16px 0 0' }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17, color: C.ink, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft, padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

export function Pager({ page, setPage, total, pageSize = PAGE_SIZE }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between" style={{ marginTop: 14, fontSize: 13, color: C.inkSoft }}>
      <span>Página {page + 1} de {pages} · {total} registros</span>
      <div className="flex gap-2">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={pagerBtn(page === 0)}><ChevronLeft size={16} /></button>
        <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} style={pagerBtn(page >= pages - 1)}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
function pagerBtn(disabled) {
  return { border: `1px solid ${C.border}`, background: disabled ? '#F3F5F4' : '#fff', color: disabled ? '#B6C0BC' : C.ink, borderRadius: 8, padding: '4px 8px', cursor: disabled ? 'default' : 'pointer' };
}

export function EmptyHint({ text }) {
  return <div style={{ fontSize: 13, color: C.inkSoft, padding: '14px 0', display: 'flex', alignItems: 'center', gap: 8 }}><Info size={15} /> {text}</div>;
}

export function MovementRow({ m }) {
  const isIn = m.type === 'entrada';
  return (
    <div className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <div style={{ width: 30, height: 30, borderRadius: 8, background: isIn ? C.okBg : C.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isIn ? C.ok : C.danger }}>
          {isIn ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.product_name}</div>
          <div style={{ fontSize: 11.5, color: C.inkSoft }}>{fmtDate(m.date)} · {m.motivo}</div>
        </div>
      </div>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: isIn ? C.ok : C.danger }}>{isIn ? '+' : '-'}{fmtNum(m.qty)}</span>
    </div>
  );
}
