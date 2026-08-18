import React, { useState, useEffect } from 'react';
import { C, PAGE_SIZE } from '../lib/helpers.js';
import { inputStyle, EmptyHint, MovementRow, Pager } from '../ui.jsx';

export default function Movimientos({ movements }) {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [page, setPage] = useState(0);

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
      {pageItems.length === 0 ? <EmptyHint text="No hay movimientos con ese filtro." /> : pageItems.map(m => <MovementRow key={m.id} m={m} />)}
      <Pager page={page} setPage={setPage} total={filtered.length} />
    </div>
  );
}
