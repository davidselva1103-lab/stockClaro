import React, { useState } from 'react';
import { Check, Plus, X, Loader2, AlertTriangle } from 'lucide-react';
import { UNIDADES, fmtNum, C } from '../lib/helpers.js';
import { Modal, Field, inputStyle, primaryBtn, secondaryBtn, iconBtn } from '../ui.jsx';

function localId() { return 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); }

// Convierte de la lista genérica que se guarda en la base de datos a los 3 bloques fijos del formulario
function splitPresentaciones(list) {
  const arr = list || [];
  const caja = arr.find(p => p.nombre === 'Caja');
  const docena = arr.find(p => p.nombre === 'Docena');
  const otras = arr.filter(p => p.nombre !== 'Caja' && p.nombre !== 'Docena');
  return { caja, docena, otras };
}

export default function ProductModal({ state, categories, onClose, onSave, onAddCategory }) {
  const [data, setData] = useState(state.data);
  const [newCat, setNewCat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const costoNum = parseFloat(data.costo) || 0;
  const ventaNum = parseFloat(data.precio_venta) || 0;
  const margin = ventaNum ? (((ventaNum - costoNum) / ventaNum) * 100).toFixed(1) : null;

  const inicial = splitPresentaciones(data.presentaciones);
  const [cajaOn, setCajaOn] = useState(!!inicial.caja);
  const [cajaUnidades, setCajaUnidades] = useState(inicial.caja ? String(inicial.caja.cantidad) : '');
  const [cajaPrecio, setCajaPrecio] = useState(inicial.caja ? String(inicial.caja.precio) : '');
  const [cajaPrecioAuto, setCajaPrecioAuto] = useState(!inicial.caja);

  const [docenaOn, setDocenaOn] = useState(!!inicial.docena);
  const [docenaPrecio, setDocenaPrecio] = useState(inicial.docena ? String(inicial.docena.precio) : '');
  const [docenaPrecioAuto, setDocenaPrecioAuto] = useState(!inicial.docena);

  const [otras, setOtras] = useState((inicial.otras || []).map(p => ({ ...p, cantidad: String(p.cantidad), precio: String(p.precio) })));

  function onCajaUnidadesChange(v) {
    setCajaUnidades(v);
    if (cajaPrecioAuto) { const n = parseFloat(v) || 0; setCajaPrecio(n ? (n * ventaNum).toFixed(2) : ''); }
  }
  function onCajaPrecioChange(v) { setCajaPrecio(v); setCajaPrecioAuto(false); }
  function recalcularCajaPrecio() { const n = parseFloat(cajaUnidades) || 0; setCajaPrecio(n ? (n * ventaNum).toFixed(2) : ''); setCajaPrecioAuto(true); }
  function onDocenaPrecioChange(v) { setDocenaPrecio(v); setDocenaPrecioAuto(false); }
  function recalcularDocenaPrecio() { setDocenaPrecio((12 * ventaNum).toFixed(2)); setDocenaPrecioAuto(true); }

  function addOtra() { setOtras(o => [...o, { id: localId(), nombre: '', cantidad: '', precio: '' }]); }
  function updateOtra(id, field, value) { setOtras(o => o.map(p => p.id === id ? { ...p, [field]: value } : p)); }
  function removeOtra(id) { setOtras(o => o.filter(p => p.id !== id)); }

  const cajaUnidadesNum = parseFloat(cajaUnidades) || 0;
  const cajaEfectivo = cajaUnidadesNum > 0 && parseFloat(cajaPrecio) > 0 ? parseFloat(cajaPrecio) / cajaUnidadesNum : null;
  const docenaEfectivo = parseFloat(docenaPrecio) > 0 ? parseFloat(docenaPrecio) / 12 : null;

  async function handleSave() {
    if (!data.nombre.trim()) { setError('Ponle un nombre al producto.'); return; }
    if (cajaOn && cajaUnidadesNum <= 0) { setError('Escribe cuántas unidades trae una caja (tiene que ser mayor a 0).'); return; }

    const presentaciones = [];
    if (cajaOn && cajaUnidadesNum > 0) presentaciones.push({ id: inicial.caja?.id || localId(), nombre: 'Caja', cantidad: cajaUnidadesNum, precio: parseFloat(cajaPrecio) || 0 });
    if (docenaOn) presentaciones.push({ id: inicial.docena?.id || localId(), nombre: 'Docena', cantidad: 12, precio: parseFloat(docenaPrecio) || 0 });
    otras.forEach(p => { if (p.nombre.trim() && parseFloat(p.cantidad) > 0) presentaciones.push({ id: p.id, nombre: p.nombre.trim(), cantidad: parseFloat(p.cantidad), precio: parseFloat(p.precio) || 0 }); });

    setSaving(true);
    setError(null);
    const ok = await onSave({ ...data, presentaciones });
    setSaving(false);
    if (ok === false) setError('No se pudo guardar. Revisa tu conexión a internet e intenta de nuevo en unos segundos (si tu proyecto de Supabase estaba dormido, puede tardar un poco en despertar).');
  }

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
        <Field label="Precio costo (lo que te cuesta 1 unidad)"><input type="number" step="0.01" style={inputStyle} value={data.costo} onChange={e => set('costo', e.target.value)} /></Field>
        <Field label="Precio de venta por unidad"><input type="number" step="0.01" style={inputStyle} value={data.precio_venta} onChange={e => set('precio_venta', e.target.value)} /></Field>
      </div>
      {margin !== null && !isNaN(margin) && (
        <div style={{ fontSize: 12.5, color: margin >= 0 ? C.ok : C.danger, marginBottom: 14, fontWeight: 600 }}>Margen de utilidad por unidad: {margin}%</div>
      )}

      <div style={{ background: '#FAFCFB', border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>¿También vendes este producto por caja o por docena?</div>

        {/* CAJA */}
        <ToggleRow label="Vender por caja" on={cajaOn} onChange={setCajaOn} />
        {cajaOn && (
          <div style={{ marginLeft: 4, marginBottom: 14, paddingLeft: 10, borderLeft: `2px solid ${C.border}` }}>
            <Field label="¿Cuántas unidades trae 1 caja?">
              <input type="number" style={inputStyle} placeholder="Ej. 30" value={cajaUnidades} onChange={e => onCajaUnidadesChange(e.target.value)} />
            </Field>
            {cajaUnidadesNum === 1 && (
              <div className="flex items-center gap-2" style={{ color: C.warn, fontSize: 12, marginTop: -8, marginBottom: 10 }}>
                <AlertTriangle size={13} /> Si la caja trae solo 1 unidad, es lo mismo que venderlo por unidad. ¿No trae más?
              </div>
            )}
            <div className="flex items-end gap-2">
              <div style={{ flex: 1 }}>
                <Field label="Precio de la caja completa">
                  <input type="number" step="0.01" style={inputStyle} placeholder="Se sugiere solo" value={cajaPrecio} onChange={e => onCajaPrecioChange(e.target.value)} />
                </Field>
              </div>
              <button type="button" title="Volver a sugerir el precio" onClick={recalcularCajaPrecio} style={{ ...iconBtn, border: `1px solid ${C.border}`, marginBottom: 14 }}>↺</button>
            </div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: -8 }}>
              {cajaUnidadesNum > 0 ? `1 caja = ${fmtNum(cajaUnidadesNum)} unidades` : ''}
              {cajaEfectivo !== null && <> · ≈ {fmtNum(cajaEfectivo)} por unidad{ventaNum > 0 && cajaEfectivo < ventaNum ? ' (más barato que por unidad, correcto para un mayoreo)' : ventaNum > 0 && cajaEfectivo > ventaNum ? ' (¡ojo! sale más caro que comprar suelto)' : ''}</>}
            </div>
          </div>
        )}

        {/* DOCENA */}
        <ToggleRow label="Vender por docena (12 unidades)" on={docenaOn} onChange={setDocenaOn} />
        {docenaOn && (
          <div style={{ marginLeft: 4, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${C.border}` }}>
            <div className="flex items-end gap-2">
              <div style={{ flex: 1 }}>
                <Field label="Precio de la docena completa">
                  <input type="number" step="0.01" style={inputStyle} placeholder="Se sugiere solo" value={docenaPrecio} onChange={e => onDocenaPrecioChange(e.target.value)} />
                </Field>
              </div>
              <button type="button" title="Volver a sugerir el precio" onClick={recalcularDocenaPrecio} style={{ ...iconBtn, border: `1px solid ${C.border}`, marginBottom: 14 }}>↺</button>
            </div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: -8 }}>
              1 docena = 12 unidades
              {docenaEfectivo !== null && <> · ≈ {fmtNum(docenaEfectivo)} por unidad{ventaNum > 0 && docenaEfectivo < ventaNum ? ' (con descuento)' : ''}</>}
            </div>
          </div>
        )}

        {/* OTRAS */}
        {otras.map(p => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 0.9fr auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <input style={{ ...inputStyle, fontSize: 12.5 }} placeholder="Nombre (ej. Paquete)" value={p.nombre} onChange={e => updateOtra(p.id, 'nombre', e.target.value)} />
            <input type="number" style={{ ...inputStyle, fontSize: 12.5 }} placeholder="Unidades" value={p.cantidad} onChange={e => updateOtra(p.id, 'cantidad', e.target.value)} />
            <input type="number" step="0.01" style={{ ...inputStyle, fontSize: 12.5 }} placeholder="Precio" value={p.precio} onChange={e => updateOtra(p.id, 'precio', e.target.value)} />
            <button type="button" onClick={() => removeOtra(p.id)} style={{ ...iconBtn, color: C.danger }}><X size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={addOtra} style={{ ...secondaryBtn, padding: '6px 10px', fontSize: 12, marginTop: 4 }}><Plus size={13} /> Agregar otra forma de venta</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {state.mode === 'new' && <Field label="Stock inicial (en unidades)"><input type="number" style={inputStyle} value={data.stock} onChange={e => set('stock', e.target.value)} /></Field>}
        <Field label="Stock mínimo (alerta)"><input type="number" style={inputStyle} value={data.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} /></Field>
      </div>
      {state.mode === 'edit' && <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>Para cambiar el stock usa la pestaña <strong>Movimientos</strong>, así queda en el historial.</div>}

      {error && (
        <div className="flex items-start gap-2" style={{ background: C.dangerBg, color: C.danger, padding: '10px 12px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{error}</span>
        </div>
      )}
      <div className="flex gap-2" style={{ marginTop: 4 }}>
        <button onClick={onClose} disabled={saving} style={secondaryBtn}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Modal>
  );
}

function ToggleRow({ label, on, onChange }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</span>
      <button type="button" onClick={() => onChange(!on)} style={{
        width: 44, height: 25, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
        background: on ? C.brand : '#D9E1DE', transition: 'background .15s',
      }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 21 : 2, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
      </button>
    </div>
  );
}
