import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Edit2, Trash2 } from 'lucide-react';
import { C, PAGE_SIZE, fmtNum, fmtDate } from '../lib/helpers.js';
import { inputStyle, EmptyHint, Pager, Modal, secondaryBtn, primaryBtn, iconBtn } from '../ui.jsx';
import MovementEditModal from './MovementEditModal.jsx';

export default function Movimientos({ movements, isAdmin, onEditMovement, onDeleteMovement }) {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { setPage(0); }, [q, typeFilter]);

  const filtered = movements.filter(m => {
    if (typeFilter !== 'todos' && m.type !== typeFilter) return false;
    if (q && !(m.product_name.toLowerCase().includes(q.toLowerCase()) || (m.sku || '').toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5 }}>Historial de movimientos</div>
        <div className="flex gap-2">
          <input placeholder="Buscar producto…" value={q} onChange={e => setQ(e.target.value)} style={{ ...inputStyle, width: 170 }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, width: 120 }}>
            <option value="todos">Todos</option><option value="entrada">Entradas</option><option value="salida">Salidas</option>
          </select>
        </div>
      </div>

      {pageItems.length === 0 ? <EmptyHint text="No hay movimientos con ese filtro." /> : pageItems.map(m => {
        const isIn = m.type === 'entrada';
        return (
          <div key={m.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}`, gap: 8 }}>
            <div className="flex items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: isIn ? C.okBg : C.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isIn ? C.ok : C.danger, flexShrink: 0 }}>
                {isIn ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.product_name}</div>
                <div style={{ fontSize: 11.5, color: C.inkSoft }}>{fmtDate(m.date)} · {m.motivo}{m.note ? ' · ' + m.note : ''}</div>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: isIn ? C.ok : C.danger }}>{isIn ? '+' : '-'}{fmtNum(m.qty)}</span>
              {isAdmin && (
                <>
                  <button onClick={() => setEditing(m)} style={iconBtn}><Edit2 size={14} /></button>
                  <button onClick={() => setConfirmDel(m)} style={{ ...iconBtn, color: C.danger }}><Trash2 size={14} /></button>
                </>
              )}
            </div>
          </div>
        );
      })}
      <Pager page={page} setPage={setPage} total={filtered.length} />

      {editing && (
        <MovementEditModal movement={editing} onClose={() => setEditing(null)} onSave={(m, changes) => { onEditMovement(m, changes); setEditing(null); }} />
      )}
      {confirmDel && (
        <Modal title="Eliminar movimiento" onClose={() => setConfirmDel(null)} width={380}>
          <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 0 }}>
            ¿Eliminar este movimiento de <strong style={{ color: C.ink }}>{confirmDel.product_name}</strong> ({confirmDel.type === 'entrada' ? '+' : '-'}{fmtNum(confirmDel.qty)})?
            El stock del producto se ajustará automáticamente para revertir este movimiento.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDel(null)} style={secondaryBtn}>Cancelar</button>
            <button onClick={() => { onDeleteMovement(confirmDel); setConfirmDel(null); }} style={{ ...primaryBtn, background: C.danger }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
