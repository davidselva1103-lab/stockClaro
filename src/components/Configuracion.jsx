import React, { useState } from 'react';
import { Plus, Trash2, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { C } from '../lib/helpers.js';
import { Badge, inputStyle, secondaryBtn, iconBtn } from '../ui.jsx';

const ROLE_LABEL = { admin: 'Administrador', editor: 'Editor', viewer: 'Solo lectura' };

export default function Configuracion({ categories, products, profile, profiles, isAdmin, canEdit, config,
  onAddCategory, onDeleteCategory, onChangeCurrency, onChangeRole, onExport, onImportClick, onTemplate, onSignOut }) {
  const [newCat, setNewCat] = useState('');
  const [currency, setCurrency] = useState(config?.currency || 'C$');

  return (
    <div className="cfg-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 12 }}>Categorías</div>
        {categories.map(c => {
          const count = products.filter(p => p.categoria === c.name).length;
          return (
            <div key={c.id} className="flex items-center justify-between" style={{ padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
              <Badge color="#fff" bg={c.color}>{c.name} · {count}</Badge>
              {canEdit && <button onClick={() => onDeleteCategory(c.id)} style={{ ...iconBtn, color: C.danger }}><Trash2 size={14} /></button>}
            </div>
          );
        })}
        {canEdit && (
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <input style={inputStyle} placeholder="Nueva categoría" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <button onClick={() => { onAddCategory(newCat); setNewCat(''); }} style={secondaryBtn}><Plus size={14} /></button>
          </div>
        )}

        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, margin: '20px 0 10px' }}>Moneda</div>
        <div className="flex gap-2">
          <input style={{ ...inputStyle, width: 90 }} value={currency} onChange={e => setCurrency(e.target.value)} disabled={!canEdit} />
          {canEdit && <button onClick={() => onChangeCurrency(currency)} style={secondaryBtn}>Guardar</button>}
        </div>

        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, margin: '20px 0 10px' }}>Tu cuenta</div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>{profile?.email} · <Badge color={C.brand} bg={C.brandSoft}>{ROLE_LABEL[profile?.role] || profile?.role}</Badge></div>
        <button onClick={onSignOut} style={secondaryBtn}>Cerrar sesión</button>
      </div>

      <div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 12 }}>Excel y respaldo</div>
          <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 0 }}>El sistema guarda todo automáticamente en la nube. Usa Excel para respaldos o para una carga inicial masiva.</p>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button onClick={onExport} style={secondaryBtn}><Download size={14} /> Exportar respaldo (.xlsx)</button>
            {canEdit && <button onClick={onImportClick} style={secondaryBtn}><Upload size={14} /> Importar productos</button>}
            <button onClick={onTemplate} style={secondaryBtn}><FileSpreadsheet size={14} /> Descargar plantilla</button>
          </div>
        </div>

        {isAdmin && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
            <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 4 }}>Usuarios</div>
            <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 0, marginBottom: 12 }}>Solo tú, como administrador, puedes cambiar el rol de otras personas. "Editor" puede modificar el inventario; "Solo lectura" únicamente puede verlo.</p>
            {(profiles || []).map(u => (
              <div key={u.id} className="flex items-center justify-between" style={{ padding: '7px 0', borderBottom: `1px solid ${C.border}`, gap: 8 }}>
                <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                <select value={u.role} onChange={e => onChangeRole(u.id, e.target.value)} disabled={u.id === profile.id} style={{ ...inputStyle, width: 140, padding: '5px 8px', fontSize: 12.5 }}>
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Solo lectura</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
