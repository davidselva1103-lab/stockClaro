import React, { useMemo } from 'react';
import { C, fmtNum } from '../lib/helpers.js';
import { EmptyHint } from '../ui.jsx';

export default function Reportes({ products, movements, money }) {
  const totals = useMemo(() => {
    const valorCosto = products.reduce((s, p) => s + p.costo * p.stock, 0);
    const valorVenta = products.reduce((s, p) => s + p.precio_venta * p.stock, 0);
    const ventas = movements.filter(m => m.type === 'salida' && m.motivo === 'venta');
    const utilidadRealizada = ventas.reduce((s, m) => s + (m.venta_unit - m.costo_unit) * m.qty, 0);
    return { valorCosto, valorVenta, utilidadPotencial: valorVenta - valorCosto, utilidadRealizada };
  }, [products, movements]);

  const topProfit = useMemo(() => {
    const map = {};
    movements.filter(m => m.type === 'salida' && m.motivo === 'venta').forEach(m => {
      if (!map[m.product_id]) map[m.product_id] = { productName: m.product_name, sku: m.sku, qty: 0, utilidad: 0 };
      map[m.product_id].qty += m.qty;
      map[m.product_id].utilidad += (m.venta_unit - m.costo_unit) * m.qty;
    });
    return Object.values(map).sort((a, b) => b.utilidad - a.utilidad).slice(0, 8);
  }, [movements]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
        {[['Valor a costo', totals.valorCosto], ['Valor a venta', totals.valorVenta], ['Utilidad potencial', totals.utilidadPotencial], ['Utilidad realizada', totals.utilidadRealizada]].map(([label, val], i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
            <div style={{ fontSize: 12, color: C.inkSoft }}>{label}</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 19 }}>{money(val)}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 10 }}>Productos que más utilidad han generado</div>
        {topProfit.length === 0 ? <EmptyHint text="Registra ventas en Movimientos para ver este ranking." /> : (
          <table>
            <thead><tr><th>Producto</th><th>SKU</th><th>Unidades vendidas</th><th>Utilidad generada</th></tr></thead>
            <tbody>
              {topProfit.map((r, i) => (
                <tr key={i}><td style={{ fontWeight: 600 }}>{r.productName}</td><td style={{ fontFamily: 'IBM Plex Mono, monospace', color: C.inkSoft }}>{r.sku}</td><td>{fmtNum(r.qty)}</td><td style={{ color: C.ok, fontWeight: 700 }}>{money(r.utilidad)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 10 }}>Margen por producto</div>
        <table>
          <thead><tr><th>Producto</th><th>Costo</th><th>Venta</th><th>Margen</th><th>Stock</th><th>Utilidad si vendes todo</th></tr></thead>
          <tbody>
            {products.slice(0, 40).map(p => {
              const margin = p.precio_venta ? (((p.precio_venta - p.costo) / p.precio_venta) * 100).toFixed(0) : 0;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td><td>{money(p.costo)}</td><td>{money(p.precio_venta)}</td>
                  <td style={{ color: margin >= 0 ? C.ok : C.danger, fontWeight: 600 }}>{margin}%</td>
                  <td>{fmtNum(p.stock)}</td><td>{money((p.precio_venta - p.costo) * p.stock)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length > 40 && <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>Mostrando 40 de {products.length}. Exporta a Excel para ver el listado completo.</div>}
      </div>
    </div>
  );
}
