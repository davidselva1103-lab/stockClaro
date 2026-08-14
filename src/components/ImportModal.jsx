import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { C } from '../lib/helpers.js';
import { Modal, secondaryBtn } from '../ui.jsx';

export default function ImportModal({ onClose, onImport, onTemplate }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  return (
    <Modal title="Importar productos desde Excel" onClose={onClose}>
      <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 0 }}>Usa la plantilla para que las columnas coincidan: SKU, Nombre, Categoria, Costo, PrecioVenta, Stock, StockMinimo, Unidad.</p>
      <button onClick={onTemplate} style={{ ...secondaryBtn, marginBottom: 14 }}><FileSpreadsheet size={14} /> Descargar plantilla</button>
      <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', color: C.inkSoft }}>
        <Upload size={22} style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 13.5 }}>{fileName || 'Haz clic para elegir un archivo .xlsx'}</div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) { setFileName(f.name); onImport(f); } }} />
      </div>
    </Modal>
  );
}
