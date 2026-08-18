import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { C, matchesSearch, fmtNum } from '../lib/helpers.js';
import { inputStyle } from '../ui.jsx';

export default function ProductPicker({ products, onAdd, placeholder = 'Buscar producto por nombre, SKU o descripción…' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = q.trim() ? products.filter(p => matchesSearch(p, q)).slice(0, 8) : products.slice(0, 8);

  function pick(p) {
    onAdd(p);
    setQ('');
    setOpen(false);
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: C.inkSoft }} />
        <input
          style={{ ...inputStyle, paddingLeft: 32 }}
          value={q}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
        />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 12px 30px rgba(0,0,0,.12)', zIndex: 50, maxHeight: 280, overflowY: 'auto' }}>
          {results.length === 0 && <div style={{ padding: 12, fontSize: 13, color: C.inkSoft }}>Sin resultados.</div>}
          {results.map(p => (
            <div key={p.id} onClick={() => pick(p)} style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}
              onMouseDown={e => e.preventDefault()}>
              <div className="flex items-center justify-between">
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nombre}</span>
                <span style={{ fontSize: 11.5, color: C.inkSoft, fontFamily: 'IBM Plex Mono, monospace' }}>{fmtNum(p.stock)} {p.unidad}</span>
              </div>
              {(p.descripcion || p.sku) && (
                <div style={{ fontSize: 11.5, color: C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.sku ? p.sku + (p.descripcion ? ' · ' : '') : ''}{p.descripcion || ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
