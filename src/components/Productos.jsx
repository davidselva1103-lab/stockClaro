import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { C, STATUS_META, stockStatus, colorForCategory, fmtNum, PAGE_SIZE, matchesSearch } from '../lib/helpers.js';
import { Badge, StockGauge, EmptyHint, Pager, inputStyle, primaryBtn, iconBtn } from '../ui.jsx';

export default function Productos({ products, categories, canEdit, money, onNew, onEdit, onDelete }) {
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => products.filter(p => {
    if (!matchesSearch(p, q)) return false;
    if (catFilter !== 'todas' && p.categoria !== catFilter) return false;
    if (statusFilter !== 'todos' && stockStatus(p) !== statusFilter) return false;
    return true;
  }), [products, q, catFilter, statusFilter]);

  useEffect(() => { setPage(0); }, [q, catFilter, statusFilter]);
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: C.inkSoft }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o SKU…" style={{ ...inputStyle, paddingLeft: 32, width: 220 }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inputStyle, width: 150 }}>
            <option value="todas">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 140 }}>
            <option value="todos">Todos los estados</option>
            <option value="ok">Stock OK</option>
            <option value="bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>
        </div>
        {canEdit && <button onClick={onNew} style={primaryBtn}><Plus size={15} /> Nuevo producto</button>}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr>
              <th>SKU</th><th>Producto</th><th>Categoría</th><th>Costo</th><th>Venta</th><th>Margen</th><th>Stock</th><th>Estado</th>{canEdit && <th></th>}
            </tr></thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr><td colSpan={9}><EmptyHint text={products.length === 0 ? 'No hay productos todavía. Agrega el primero.' : 'No hay resultados con ese filtro.'} /></td></tr>
              )}
              {pageItems.map(p => {
                const meta = STATUS_META[stockStatus(p)];
                const margin = p.precio_venta ? (((p.precio_venta - p.costo) / p.precio_venta) * 100).toFixed(0) : 0;
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'IBM Plex Mono, monospace', color: C.inkSoft }}>{p.sku}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                      {p.descripcion && <div style={{ fontSize: 11.5, color: C.inkSoft, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>}
                    </td>
                    <td><Badge color="#fff" bg={colorForCategory(p.categoria, categories)}>{p.categoria}</Badge></td>
                    <td>{money(p.costo)}</td>
                    <td>{money(p.precio_venta)}</td>
                    <td style={{ color: margin >= 0 ? C.ok : C.danger, fontWeight: 600 }}>{margin}%</td>
                    <td><StockGauge p={p} /></td>
                    <td><Badge color={meta.color} bg={meta.bg}>{meta.label}</Badge></td>
                    {canEdit && (
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => onEdit(p)} style={iconBtn}><Edit2 size={14} /></button>
                          <button onClick={() => onDelete(p)} style={{ ...iconBtn, color: C.danger }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '0 14px 14px' }}><Pager page={page} setPage={setPage} total={filtered.length} /></div>
      </div>
    </div>
  );
}
