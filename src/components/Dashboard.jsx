import React, { useMemo } from 'react';
import { Package, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { C, STATUS_META, stockStatus, colorForCategory, fmtNum } from '../lib/helpers.js';
import { Badge, EmptyHint, MovementRow } from '../ui.jsx';
import { secondaryBtn } from '../ui.jsx';

export default function Dashboard({ products, movements, categories, money, setTab }) {
  const totals = useMemo(() => {
    const valorCosto = products.reduce((s, p) => s + p.costo * p.stock, 0);
    const valorVenta = products.reduce((s, p) => s + p.precio_venta * p.stock, 0);
    const utilidadPotencial = valorVenta - valorCosto;
    const bajo = products.filter(p => stockStatus(p) === 'bajo').length;
    const agotado = products.filter(p => stockStatus(p) === 'agotado').length;
    const ventas = movements.filter(m => m.type === 'salida' && m.motivo === 'venta');
    const utilidadRealizada = ventas.reduce((s, m) => s + (m.venta_unit - m.costo_unit) * m.qty, 0);
    return { valorCosto, valorVenta, utilidadPotencial, bajo, agotado, utilidadRealizada };
  }, [products, movements]);

  const catValueData = useMemo(() => {
    const map = {};
    products.forEach(p => { map[p.categoria] = (map[p.categoria] || 0) + p.precio_venta * p.stock; });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: colorForCategory(name, categories) })).sort((a, b) => b.value - a.value);
  }, [products, categories]);

  const cards = [
    { label: 'Productos activos', value: products.length, icon: Package, color: C.brand },
    { label: 'Valor inventario (venta)', value: money(totals.valorVenta), icon: TrendingUp, color: C.brand },
    { label: 'Utilidad potencial', value: money(totals.utilidadPotencial), icon: TrendingUp, color: C.ok },
    { label: 'Utilidad realizada (ventas)', value: money(totals.utilidadRealizada), icon: TrendingUp, color: C.ok },
  ];
  const recent = movements.slice(0, 6);
  const lowStock = products.filter(p => stockStatus(p) !== 'ok').sort((a, b) => stockStatus(a) === 'agotado' ? -1 : 1).slice(0, 6);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8, color: c.color }}><c.icon size={16} /></div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: C.ink }}>{c.value}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 14, marginBottom: 18, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '.04em' }}>Leyenda</span>
        <Badge color={STATUS_META.ok.color} bg={STATUS_META.ok.bg}>● Stock OK</Badge>
        <Badge color={STATUS_META.bajo.color} bg={STATUS_META.bajo.bg}>● Stock bajo ({totals.bajo})</Badge>
        <Badge color={STATUS_META.agotado.color} bg={STATUS_META.agotado.bg}>● Agotado ({totals.agotado})</Badge>
      </div>

      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
          <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 10 }}>Valor de inventario por categoría</div>
          {catValueData.length === 0 ? <EmptyHint text="Agrega productos para ver este gráfico" /> : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={catValueData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAEFEC" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke={C.inkSoft} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11.5 }} width={90} stroke={C.inkSoft} />
                  <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {catValueData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
          <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 10 }}>Necesitan atención</div>
          {lowStock.length === 0 ? <EmptyHint text="Todo tu stock está en buen nivel" /> : lowStock.map(p => {
            const meta = STATUS_META[stockStatus(p)];
            return (
              <div key={p.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11.5, color: C.inkSoft, fontFamily: 'IBM Plex Mono, monospace' }}>{p.sku}</div>
                </div>
                <Badge color={meta.color} bg={meta.bg}>{fmtNum(p.stock)} {p.unidad}</Badge>
              </div>
            );
          })}
          <button onClick={() => setTab('productos')} style={{ ...secondaryBtn, width: '100%', marginTop: 12, justifyContent: 'center' }}>Ver todos los productos</button>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, marginBottom: 10 }}>Movimientos recientes</div>
        {recent.length === 0 ? <EmptyHint text="Aún no hay movimientos registrados" /> : recent.map(m => <MovementRow key={m.id} m={m} />)}
      </div>
    </div>
  );
}
