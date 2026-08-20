import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { C, MOTIVOS } from '../lib/helpers.js';
import { Modal, Field, inputStyle, primaryBtn, secondaryBtn } from '../ui.jsx';

const MOTIVOS_EDIT = {
  entrada: [...MOTIVOS.entrada, ['inicial', 'Inventario inicial']],
  salida: MOTIVOS.salida,
};

export default function MovementEditModal({ movement, onClose, onSave }) {
  const [qty, setQty] = useState(String(movement.qty));
  const [motivo, setMotivo] = useState(movement.motivo);
  const [note, setNote] = useState(movement.note || '');

  function save() {
    const q = parseFloat(qty);
    if (!q || q <= 0) return;
    onSave(movement, { qty: q, motivo, note });
  }

  return (
    <Modal title={`Editar ${movement.type === 'entrada' ? 'entrada' : 'salida'}`} onClose={onClose} width={400}>
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 14 }}>{movement.product_name} · {movement.sku}</div>
      <p style={{ fontSize: 12, color: C.inkSoft, marginTop: -8, marginBottom: 14 }}>El stock del producto se ajustará automáticamente según el cambio que hagas aquí. Si el producto o el tipo (entrada/salida) están mal, es mejor eliminar este movimiento y registrar uno nuevo.</p>
      <Field label="Cantidad"><input type="number" style={inputStyle} value={qty} onChange={e => setQty(e.target.value)} /></Field>
      <Field label="Motivo">
        <select style={inputStyle} value={motivo} onChange={e => setMotivo(e.target.value)}>
          {(MOTIVOS_EDIT[movement.type] || MOTIVOS_EDIT.salida).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <Field label="Nota"><input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} /></Field>
      <div className="flex gap-2">
        <button onClick={onClose} style={secondaryBtn}>Cancelar</button>
        <button onClick={save} style={primaryBtn}><Check size={15} /> Guardar cambios</button>
      </div>
    </Modal>
  );
}
