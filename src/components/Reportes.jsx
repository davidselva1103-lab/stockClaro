import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { C, fmtNum, PERIODS, startOfPeriod } from '../lib/helpers.js';
import { EmptyHint, inputStyle } from '../ui.jsx';

function PeriodStat({ label, value, color }) {
  return (
    <div style={{ background: '#FAFCFB', border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11.5, color: C.inkSoft }}>{label}</div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17, color: color || C.ink }}>{value}</div>
    </div>
  );
}

function toISODate(d) { return d.toISOString().slice(0, 10); }
function daysAgoISO(n) { const d = new Date(); d.setDate(d.getDate() - n); return toISODate(d); }

export default function Reportes({ products, movements, money }) {
  const [period, setPeriod] = useState('dia');
  const [desde, setDesde] = useState(daysAgoISO(30));
  const [hasta, setHasta] = useState(toISODate(new Date()));
  const [productoFiltro, setProductoFiltro] = useState('todos');

  const ventasFiltradas = useMemo(() => {
    const start = new Date(desde + 'T00:00:00');
    const end = new Date(hasta + 'T23:59:59');
    return movements.filter(m => m.type === 'salida' && (m.motivo === 'venta' || m.motivo === 'venta_especial')
      && new Date(m.date) >= start && new Date(m.date) <= end
      && (productoFiltro === 'todos' || m.product_id === productoFiltro));
  }, [movements, desde, hasta, productoFiltro]);

  const ventasPorProducto = useMemo(() => {
    const map = {};
    ventasFiltradas.forEach(m => {
      if (!map[m.product_id]) map[m.product_id] = { productId: m.product_id, nombre: m.product_name, qty: 0, ingresos: 0, utilidad: 0 };
      map[m.product_id].qty += m.qty;
      map[m.product_id].ingresos += m.venta_unit * m.qty;
      map[m.product_id].utilidad += (m.venta_unit - m.costo_unit) * m.qty;
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [ventasFiltradas]);

  const rangoStats = useMemo(() => ({
    unidades: ventasFiltradas.reduce((s, m) => s + m.qty, 0),
    ingresos: ventasFiltradas.reduce((s, m) => s + m.venta_unit * m.qty, 0),
    utilidad: ventasFiltradas.reduce((s, m) => s + (m.venta_unit - m.costo_unit) * m.qty, 0),
  }), [ventasFiltradas]);

  function preset(dias) { setDesde(daysAgoISO(dias)); setHasta(toISODate(new Date())); }
  const periodStats = useMemo(() => {
    const start = startOfPeriod(period);
    const ventas = movements.filter(m => m.type === 'salida' && m.motivo === 'venta' && new Date(m.date) >= start);
    const utilidad = ventas.reduce((s, m) => s + (m.venta_unit - m.costo_unit) * m.qty, 0);
    const unidades = ventas.reduce((s, m) => s + m.qty, 0);
    const ingresos = ventas.reduce((s, m) => s + m.venta_unit * m.qty, 0);
    return { utilidad, unidades, ingresos };
  }, [movements, period]);
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
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 4 }}>Qué se vendió más</div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>Filtra por fecha y, si quieres, por un producto específico.</div>

        <div className="flex items-end gap-2" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: C.inkSoft, marginBottom: 4 }}>Desde</label>
            <input type="date" style={{ ...inputStyle, width: 150 }} value={desde} onChange={e => setDesde(e.target.value)} max={hasta} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: C.inkSoft, marginBottom: 4 }}>Hasta</label>
            <input type="date" style={{ ...inputStyle, width: 150 }} value={hasta} onChange={e => setHasta(e.target.value)} min={desde} max={toISODate(new Date())} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: C.inkSoft, marginBottom: 4 }}>Producto</label>
            <select style={inputStyle} value={productoFiltro} onChange={e => setProductoFiltro(e.target.value)}>
              <option value="todos">Todos los productos</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {[['Hoy', 0], ['7 días', 7], ['30 días', 30], ['90 días', 90]].map(([l, d]) => (
              <button key={l} onClick={() => preset(d)} style={{ padding: '9px 10px', borderRadius: 9, border: `1px solid ${C.border}`, background: '#fff', color: C.inkSoft, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          <PeriodStat label="Unidades vendidas" value={fmtNum(rangoStats.unidades)} />
          <PeriodStat label="Ingresos" value={money(rangoStats.ingresos)} />
          <PeriodStat label="Utilidad generada" value={money(rangoStats.utilidad)} color={C.ok} />
        </div>

        {ventasPorProducto.length === 0 ? <EmptyHint text="No hay ventas registradas en ese rango de fechas." /> : (
          <>
            <div style={{ width: '100%', height: Math.min(340, Math.max(140, ventasPorProducto.slice(0, 10).length * 34)) }}>
              <ResponsiveContainer>
                <BarChart data={ventasPorProducto.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAEFEC" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke={C.inkSoft} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11.5 }} width={120} stroke={C.inkSoft} />
                  <Tooltip formatter={(v) => fmtNum(v) + ' unidades'} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="qty" radius={[0, 6, 6, 0]} fill={C.brand} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {ventasPorProducto.length > 10 && (
              <table style={{ marginTop: 10 }}>
                <thead><tr><th>Producto</th><th>Unidades</th><th>Ingresos</th><th>Utilidad</th></tr></thead>
                <tbody>
                  {ventasPorProducto.map(r => (
                    <tr key={r.productId}><td style={{ fontWeight: 600 }}>{r.nombre}</td><td>{fmtNum(r.qty)}</td><td>{money(r.ingresos)}</td><td style={{ color: C.ok, fontWeight: 700 }}>{money(r.utilidad)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5 }}>Utilidad por período</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${period === p.key ? C.brand : C.border}`,
                background: period === p.key ? C.brandSoft : '#fff', color: period === p.key ? C.brandDark : C.inkSoft,
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}>{p.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <PeriodStat label="Unidades vendidas" value={fmtNum(periodStats.unidades)} />
          <PeriodStat label="Ingresos" value={money(periodStats.ingresos)} />
          <PeriodStat label="Utilidad generada" value={money(periodStats.utilidad)} color={C.ok} />
        </div>
      </div>

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
