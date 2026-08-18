import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { UNIDADES } from '../lib/helpers.js';
import { Modal, Field, inputStyle, primaryBtn, secondaryBtn } from '../ui.jsx';

export default function ProductModal({ state, categories, onClose, onSave, onAddCategory }) {
  const [data, setData] = useState(state.data);
  const [newCat, setNewCat] = useState('');
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const costoNum = parseFloat(data.costo) || 0;
  const ventaNum = parseFloat(data.precio_venta) || 0;
  const margin = ventaNum ? (((ventaNum - costoNum) / ventaNum) * 100).toFixed(1) : null;

  return (
    <Modal title={state.mode === 'new' ? 'Nuevo producto' : 'Editar producto'} onClose={onClose}>
      <Field label="Nombre del producto *"><input style={inputStyle} value={data.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Camisa polo azul" /></Field>
      <Field label="Descripción (ayuda a diferenciarlo al buscarlo)">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={data.descripcion || ''} onChange={e => set('descripcion', e.target.value)} placeholder="Ej. Bolsa 100g, sabor fresa, empaque rojo" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="SKU / código"><input style={inputStyle} value={data.sku} onChange={e => set('sku', e.target.value)} placeholder="Autogenerado si se deja vacío" /></Field>
        <Field label="Unidad">
          <select style={inputStyle} value={data.unidad} onChange={e => set('unidad', e.target.value)}>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Categoría">
        <select style={inputStyle} value={data.categoria} onChange={e => set('categoria', e.target.value)}>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <div className="flex gap-2" style={{ marginTop: 6 }}>
          <input style={{ ...inputStyle, fontSize: 12.5 }} placeholder="+ nueva categoría" value={newCat} onChange={e => setNewCat(e.target.value)} />
          <button type="button" onClick={() => { if (newCat.trim()) { onAddCategory(newCat); set('categoria', newCat.trim()); setNewCat(''); } }} style={{ ...secondaryBtn, padding: '6px 10px' }}>Añadir</button>
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Precio costo"><input type="number" step="0.01" style={inputStyle} value={data.costo} onChange={e => set('costo', e.target.value)} /></Field>
        <Field label="Precio de venta"><input type="number" step="0.01" style={inputStyle} value={data.precio_venta} onChange={e => set('precio_venta', e.target.value)} /></Field>
      </div>
      {margin !== null && !isNaN(margin) && (
        <div style={{ fontSize: 12.5, color: margin >= 0 ? '#1F9D6C' : '#C24141', marginBottom: 10, fontWeight: 600 }}>Margen de utilidad: {margin}%</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {state.mode === 'new' && <Field label="Stock inicial"><input type="number" style={inputStyle} value={data.stock} onChange={e => set('stock', e.target.value)} /></Field>}
        <Field label="Stock mínimo (alerta)"><input type="number" style={inputStyle} value={data.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} /></Field>
      </div>
      {state.mode === 'edit' && <div style={{ fontSize: 12, color: '#5C6B67', marginBottom: 12 }}>Para cambiar el stock usa la pestaña <strong>Movimientos</strong>, así queda en el historial.</div>}
      <div className="flex gap-2" style={{ marginTop: 4 }}>
        <button onClick={onClose} style={secondaryBtn}>Cancelar</button>
        <button onClick={() => onSave(data)} style={primaryBtn}><Check size={15} /> Guardar</button>
      </div>
    </Modal>
  );
}
