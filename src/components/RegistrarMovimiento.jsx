import React, { useState } from 'react';
import { Plus, Minus, X, ArrowDownCircle, ArrowUpCircle, ShoppingCart, Printer, Check } from 'lucide-react';
import { C, fmtNum, MOTIVOS } from '../lib/helpers.js';
import { Field, inputStyle, primaryBtn, secondaryBtn, EmptyHint, Modal } from '../ui.jsx';
import ProductPicker from './ProductPicker.jsx';


export default function RegistrarMovimiento({ type, products, canEdit, userEmail, money, onConfirm, notify }) {
  const isEntrada = type === 'entrada';
  const [cart, setCart] = useState([]); // {productId, nombre, sku, unidad, unitPrice, stock, qty}
  const [pending, setPending] = useState(null); // producto elegido, aún no agregado {product, qty}
  const [motivo, setMotivo] = useState(MOTIVOS[type][0][0]);
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [confirming, setConfirming] = useState(false);

  function selectProduct(p) {
    setPending({ product: p, qty: 1 });
  }
  function changePendingQty(delta) {
    setPending(pd => pd ? { ...pd, qty: Math.max(1, pd.qty + delta) } : pd);
  }
  function addPendingToCart() {
    if (!pending) return;
    const p = pending.product;
    setCart(c => {
      const existing = c.find(i => i.productId === p.id);
      if (existing) return c.map(i => i.productId === p.id ? { ...i, qty: i.qty + pending.qty } : i);
      return [...c, { productId: p.id, nombre: p.nombre, sku: p.sku, unidad: p.unidad, unitPrice: isEntrada ? p.costo : p.precio_venta, qty: pending.qty, stock: p.stock }];
    });
    setPending(null);
  }
  function changeQty(productId, delta) {
    setCart(c => c.map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  }
  function removeItem(productId) { setCart(c => c.filter(i => i.productId !== productId)); }

  const totalUnidades = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  async function confirm() {
    if (cart.length === 0) { notify('Agrega al menos un producto al carrito', 'error'); return; }
    if (!isEntrada) {
      const short = cart.find(i => i.qty > i.stock);
      if (short) { notify(`Solo hay ${fmtNum(short.stock)} ${short.unidad} de "${short.nombre}"`, 'error'); return; }
    }
    setConfirming(true);
    const ok = await onConfirm({ items: cart.map(i => ({ productId: i.productId, qty: i.qty })), type, motivo, note });
    setConfirming(false);
    if (ok !== false) {
      setReceipt({ items: cart, motivo, note, date: new Date(), total, type });
      setCart([]); setNote('');
    }
  }

  if (!canEdit) {
    return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 30, textAlign: 'center' }}>
      <EmptyHint text="No tienes permiso para registrar movimientos. Pide a un administrador que te dé rol de Editor." />
    </div>;
  }

  return (
    <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEntrada ? <ArrowDownCircle size={18} color={C.ok} /> : <ArrowUpCircle size={18} color={C.danger} />}
          {isEntrada ? 'Registrar entrada' : 'Registrar salida'}
        </div>
        <ProductPicker products={products} onAdd={selectProduct} />

        {pending && (
          <div style={{ marginTop: 12, background: C.brandSoft, border: `1px solid ${C.brand}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>{pending.product.nombre}</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 10 }}>
              {money(isEntrada ? pending.product.costo : pending.product.precio_venta)} c/u · {fmtNum(pending.product.stock)} {pending.product.unidad} disponibles
            </div>
            <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="flex items-center gap-2">
                <button onClick={() => changePendingQty(-1)} style={stepBtnLg}><Minus size={15} /></button>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, fontSize: 16, minWidth: 34, textAlign: 'center' }}>{fmtNum(pending.qty)}</span>
                <button onClick={() => changePendingQty(1)} style={stepBtnLg}><Plus size={15} /></button>
                <span style={{ fontSize: 12.5, color: C.inkSoft, marginLeft: 4 }}>{pending.product.unidad}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPending(null)} style={secondaryBtn}>Cancelar</button>
                <button onClick={addPendingToCart} style={{ ...primaryBtn, background: isEntrada ? C.brand : C.danger }}><ShoppingCart size={15} /> Añadir al carrito</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {cart.length === 0 ? <EmptyHint text="Busca un producto arriba para empezar a agregarlo al carrito." /> : cart.map(i => (
            <div key={i.productId} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}`, gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.nombre}</div>
                <div style={{ fontSize: 11.5, color: C.inkSoft }}>{money(i.unitPrice)} c/u · {money(i.qty * i.unitPrice)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => changeQty(i.productId, -1)} style={stepBtn}><Minus size={13} /></button>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, minWidth: 26, textAlign: 'center' }}>{fmtNum(i.qty)}</span>
                <button onClick={() => changeQty(i.productId, 1)} style={stepBtn}><Plus size={13} /></button>
                <button onClick={() => removeItem(i.productId)} style={{ ...stepBtn, color: C.danger, marginLeft: 4 }}><X size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, alignSelf: 'start', position: 'sticky', top: 16 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5 }}>
          <ShoppingCart size={16} /> Carrito
        </div>
        <div style={{ background: C.brandSoft, borderRadius: 10, padding: 12, marginBottom: 14, marginTop: 8 }}>
          <div className="flex items-center justify-between" style={{ fontSize: 13, color: C.brandDark }}>
            <span>{cart.length} producto{cart.length !== 1 ? 's' : ''} · {fmtNum(totalUnidades)} unidad{totalUnidades !== 1 ? 'es' : ''}</span>
          </div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: C.brandDark, marginTop: 4 }}>{money(total)}</div>
        </div>
        <Field label="Motivo">
          <select style={inputStyle} value={motivo} onChange={e => setMotivo(e.target.value)}>
            {MOTIVOS[type].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Nota (opcional)"><input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="Ej. Cliente, factura #234" /></Field>
        <button onClick={confirm} disabled={cart.length === 0 || confirming} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', opacity: (cart.length === 0 || confirming) ? .5 : 1, background: isEntrada ? C.brand : C.danger }}>
          <Check size={15} /> {confirming ? 'Guardando…' : isEntrada ? 'Confirmar entrada' : 'Confirmar venta / salida'}
        </button>
      </div>

      {receipt && <ReciboModal receipt={receipt} userEmail={userEmail} money={money} onClose={() => setReceipt(null)} />}
    </div>
  );
}
const stepBtn = { width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: '#fff', color: C.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const stepBtnLg = { width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.brand}`, background: '#fff', color: C.brandDark, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

function ReciboModal({ receipt, userEmail, money, onClose }) {
  return (
    <Modal title={receipt.type === 'entrada' ? 'Recibo de entrada' : 'Mini factura de venta'} onClose={onClose} width={420}>
      <div id="receipt-print">
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 10 }}>
          {receipt.date.toLocaleString('es-NI')} · Atendido por {userEmail}
          {receipt.note && <div>Nota: {receipt.note}</div>}
        </div>
        <table>
          <thead><tr><th>Producto</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr></thead>
          <tbody>
            {receipt.items.map(i => (
              <tr key={i.productId}><td>{i.nombre}</td><td>{fmtNum(i.qty)}</td><td>{money(i.unitPrice)}</td><td>{money(i.qty * i.unitPrice)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between" style={{ padding: '12px 0', fontWeight: 700, fontSize: 15 }}>
          <span>Total</span><span>{money(receipt.total)}</span>
        </div>
      </div>
      <div className="flex gap-2" style={{ marginTop: 6 }}>
        <button onClick={onClose} style={secondaryBtn}>Cerrar</button>
        <button onClick={() => window.print()} style={primaryBtn}><Printer size={15} /> Imprimir</button>
      </div>
    </Modal>
  );
}
