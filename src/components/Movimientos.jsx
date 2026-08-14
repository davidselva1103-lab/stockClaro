import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { C, fmtNum, PAGE_SIZE } from '../lib/helpers.js';
import { Field, inputStyle, primaryBtn, EmptyHint, MovementRow, Pager } from '../ui.jsx';

const toggleBtn = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 9, border: `1px solid ${C.border}`, background: '#fff', color: C.inkSoft, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const toggleActiveOk = { background: C.okBg, color: C.ok, border: `1px solid ${C.ok}` };
const toggleActiveDanger = { background: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}` };

export default function Movimientos({ products, movements, canEdit, onRegister }) {
  const [type, setType] = useState('entrada');
  const [motivo, setMotivo] = useState('compra');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [page, setPage] = useState(0);

  useEffect(() => { setMotivo(type === 'entrada' ? 'compra' : 'venta'); }, [type]);
  useEffect(() => { setPage(0); }, [q, typeFilter]);

  const filtered = movements.filter(m => {
    if (typeFilter !== 'todos' && m.type !== typeFilter) return false;
    if (q && !(m.product_name.toLowerCase().includes(q.toLowerCase()) || (m.sku || '').toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function submit() {
    if (!productId) return;
    onRegister({ productId, type, motivo, qty, note });
    setQty(''); setNote('');
  }

  return (
    <div className="mov-grid" style={{ display: 'grid', gridTemplateColumns: canEdit ? '340px 1fr' : '1fr', gap: 16 }}>
      {canEdit && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, alignSelf: 'start' }}>
          <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 12 }}>Registrar movimiento</div>
          <div className="flex gap-2" style={{ marginBottom: 12 }}>
            <button onClick={() => setType('entrada')} style={{ ...toggleBtn, ...(type === 'entrada' ? toggleActiveOk : {}) }}><ArrowDownCircle size={15} /> Entrada</button>
            <button onClick={() => setType('salida')} style={{ ...toggleBtn, ...(type === 'salida' ? toggleActiveDanger : {}) }}><ArrowUpCircle size={15} /> Salida</button>
          </div>
          <Field label="Producto">
            <select style={inputStyle} value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">Selecciona un producto…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.nombre} ({fmtNum(p.stock)} {p.unidad} disp.)</option>)}
            </select>
          </Field>
          <Field label="Motivo">
            <select style={inputStyle} value={motivo} onChange={e => setMotivo(e.target.value)}>
              {type === 'entrada'
                ? [['compra', 'Compra a proveedor'], ['devolucion', 'Devolución de cliente'], ['ajuste', 'Ajuste de inventario']].map(([v, l]) => <option key={v} value={v}>{l}</option>)
                : [['venta', 'Venta'], ['merma', 'Merma / daño'], ['ajuste', 'Ajuste de inventario']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Cantidad"><input type="number" style={inputStyle} value={qty} onChange={e => setQty(e.target.value)} /></Field>
          <Field label="Nota (opcional)"><input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="Ej. Factura #234" /></Field>
          <button onClick={submit} disabled={!productId} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', opacity: productId ? 1 : .5 }}>Registrar</button>
        </div>
      )}

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
    </div>
  );
}
