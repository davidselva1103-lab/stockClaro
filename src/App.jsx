import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Boxes, Download, LayoutDashboard, Package, ShoppingCart, BarChart3,
  Settings as SettingsIcon, Loader2, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import { supabase } from './supabaseClient.js';
import { C, CAT_PALETTE, fmtNum } from './lib/helpers.js';
import { Toast, Modal, Field, inputStyle, primaryBtn, secondaryBtn } from './ui.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Productos from './components/Productos.jsx';
import ProductModal from './components/ProductModal.jsx';
import Movimientos from './components/Movimientos.jsx';
import RegistrarMovimiento from './components/RegistrarMovimiento.jsx';
import Reportes from './components/Reportes.jsx';
import Configuracion from './components/Configuracion.jsx';
import ImportModal from './components/ImportModal.jsx';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = no session
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [config, setConfig] = useState({ currency: 'C$' });
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const [productModal, setProductModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importModal, setImportModal] = useState(false);

  function notify(message, type = 'ok') {
    setToast({ message, type });
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 3200);
  }

  // ---------- AUTH ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---------- LOAD PROFILE + DATA ----------
  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }, []);
  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('email');
    setProfiles(data || []);
  }, []);
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('nombre');
    setProducts(data || []);
  }, []);
  const fetchMovements = useCallback(async () => {
    const { data } = await supabase.from('movements').select('*').order('date', { ascending: false }).limit(1000);
    setMovements(data || []);
  }, []);
  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  }, []);
  const fetchConfig = useCallback(async () => {
    const { data } = await supabase.from('app_config').select('*').eq('id', 1).single();
    if (data) setConfig(data);
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setDataLoading(true);
      await fetchProfile(session.user.id);
      await Promise.all([fetchProfiles(), fetchProducts(), fetchMovements(), fetchCategories(), fetchConfig()]);
      setDataLoading(false);
    })();
  }, [session]);

  // ---------- REALTIME ----------
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel('inventario-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' }, fetchMovements)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { fetchProfiles(); fetchProfile(session.user.id); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, fetchConfig)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  const money = useCallback((n) => `${config.currency || 'C$'} ${fmtNum(n)}`, [config.currency]);
  const canEdit = profile && (profile.role === 'admin' || profile.role === 'editor');
  const isAdmin = profile && profile.role === 'admin';

  // ---------- PRODUCT CRUD ----------
  function openNewProduct() { setProductModal({ mode: 'new', data: { sku: '', nombre: '', descripcion: '', categoria: categories[0]?.name || 'General', costo: '', precio_venta: '', stock: '0', stock_minimo: '5', unidad: 'unidad' } }); }
  function openEditProduct(p) { setProductModal({ mode: 'edit', data: { ...p, costo: String(p.costo), precio_venta: String(p.precio_venta), stock_minimo: String(p.stock_minimo) } }); }

  async function saveProduct(data) {
    if (!data.nombre.trim()) { notify('El nombre es obligatorio', 'error'); return; }
    const costo = parseFloat(data.costo) || 0;
    const precio_venta = parseFloat(data.precio_venta) || 0;
    const stock_minimo = parseFloat(data.stock_minimo) || 0;

    if (productModal.mode === 'new') {
      const stockInicial = parseFloat(data.stock) || 0;
      const { data: inserted, error } = await supabase.from('products').insert({
        sku: data.sku.trim() || null, nombre: data.nombre.trim(), descripcion: (data.descripcion || '').trim() || null, categoria: data.categoria,
        costo, precio_venta, stock: stockInicial, stock_minimo, unidad: data.unidad,
      }).select().single();
      if (error) { notify('No se pudo guardar: ' + error.message, 'error'); return; }
      if (stockInicial > 0) {
        await supabase.from('movements').insert({
          product_id: inserted.id, sku: inserted.sku, product_name: inserted.nombre, type: 'entrada',
          motivo: 'inicial', qty: stockInicial, costo_unit: costo, venta_unit: precio_venta, note: 'Inventario inicial',
          created_by: session.user.id,
        });
      }
      notify('Producto agregado');
    } else {
      const { error } = await supabase.from('products').update({
        sku: data.sku.trim() || null, nombre: data.nombre.trim(), descripcion: (data.descripcion || '').trim() || null, categoria: data.categoria, costo, precio_venta, stock_minimo, unidad: data.unidad,
      }).eq('id', data.id);
      if (error) { notify('No se pudo actualizar: ' + error.message, 'error'); return; }
      notify('Producto actualizado');
    }
    setProductModal(null);
    fetchProducts();
  }

  async function deleteProductConfirmed(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) notify('No se pudo eliminar: ' + error.message, 'error'); else notify('Producto eliminado');
    setConfirmDelete(null);
    fetchProducts();
  }

  // ---------- MOVEMENTS (carrito por lote) ----------
  async function confirmCartMovement({ items, type, motivo, note }) {
    for (const it of items) {
      const p = products.find(x => x.id === it.productId);
      if (!p) continue;
      const q = parseFloat(it.qty) || 0;
      if (q <= 0) continue;
      const newStock = type === 'entrada' ? p.stock + q : Math.max(0, p.stock - q);
      const { error: e1 } = await supabase.from('products').update({ stock: newStock }).eq('id', it.productId);
      if (e1) { notify('No se pudo actualizar "' + p.nombre + '": ' + e1.message, 'error'); return false; }
      const { error: e2 } = await supabase.from('movements').insert({
        product_id: it.productId, sku: p.sku, product_name: p.nombre, type, motivo, qty: q,
        costo_unit: p.costo, venta_unit: p.precio_venta, note: note || '', created_by: session.user.id,
      });
      if (e2) { notify('No se pudo registrar el movimiento de "' + p.nombre + '": ' + e2.message, 'error'); return false; }
    }
    notify(type === 'entrada' ? 'Entrada registrada' : 'Salida registrada');
    fetchProducts(); fetchMovements();
    return true;
  }

  // ---------- CATEGORIES ----------
  async function addCategory(name) {
    name = name.trim();
    if (!name) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) { notify('Esa categoría ya existe', 'error'); return; }
    const used = categories.map(c => c.color);
    const color = CAT_PALETTE.find(c => !used.includes(c)) || CAT_PALETTE[categories.length % CAT_PALETTE.length];
    const { error } = await supabase.from('categories').insert({ name, color });
    if (error) notify('No se pudo crear: ' + error.message, 'error'); else notify('Categoría creada');
    fetchCategories();
  }
  async function deleteCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    if (products.some(p => p.categoria === cat.name)) { notify('No puedes borrar una categoría en uso', 'error'); return; }
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  }

  async function changeCurrency(sym) {
    const { error } = await supabase.from('app_config').update({ currency: sym }).eq('id', 1);
    if (error) notify('No se pudo guardar: ' + error.message, 'error'); else notify('Moneda actualizada');
    fetchConfig();
  }
  async function changeRole(userId, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) notify('No se pudo cambiar el rol: ' + error.message, 'error'); else notify('Rol actualizado');
    fetchProfiles();
  }

  // ---------- EXCEL ----------
  function exportExcel() {
    const wb = XLSX.utils.book_new();
    const prodRows = products.map(p => ({
      SKU: p.sku, Nombre: p.nombre, Categoria: p.categoria, Costo: p.costo, PrecioVenta: p.precio_venta,
      'Margen %': p.precio_venta ? (((p.precio_venta - p.costo) / p.precio_venta) * 100).toFixed(1) : 0,
      Stock: p.stock, StockMinimo: p.stock_minimo, Unidad: p.unidad,
      'Valor Costo': (p.costo * p.stock).toFixed(2), 'Valor Venta': (p.precio_venta * p.stock).toFixed(2),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), 'Productos');
    const movRows = movements.map(m => ({
      Fecha: new Date(m.date).toLocaleString('es-NI'), SKU: m.sku, Producto: m.product_name, Tipo: m.type === 'entrada' ? 'Entrada' : 'Salida',
      Motivo: m.motivo, Cantidad: m.qty, CostoUnit: m.costo_unit, VentaUnit: m.venta_unit, Nota: m.note,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(movRows), 'Movimientos');
    const totalCosto = products.reduce((s, p) => s + p.costo * p.stock, 0);
    const totalVenta = products.reduce((s, p) => s + p.precio_venta * p.stock, 0);
    const resumen = [{ Indicador: 'Total productos', Valor: products.length }, { Indicador: 'Valor inventario (costo)', Valor: totalCosto.toFixed(2) }, { Indicador: 'Valor inventario (venta)', Valor: totalVenta.toFixed(2) }, { Indicador: 'Utilidad potencial', Valor: (totalVenta - totalCosto).toFixed(2) }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen');
    XLSX.writeFile(wb, `inventario-backup-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const rows = [{ SKU: 'EJ-001', Nombre: 'Producto de ejemplo', Categoria: 'General', Costo: 50, PrecioVenta: 80, Stock: 20, StockMinimo: 5, Unidad: 'unidad' }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Productos');
    XLSX.writeFile(wb, 'plantilla-productos.xlsx');
  }
  async function importExcelFile(file) {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (!rows.length) { notify('El archivo no tiene filas', 'error'); return; }
      const existingCatNames = categories.map(c => c.name);
      const newCatsToInsert = [];
      const toInsertProducts = [];
      for (const r of rows) {
        const nombre = String(r.Nombre || r.nombre || '').trim();
        if (!nombre) continue;
        const catName = String(r.Categoria || r.categoria || 'General').trim() || 'General';
        if (!existingCatNames.includes(catName) && !newCatsToInsert.some(c => c.name === catName)) {
          const used = [...categories.map(c => c.color), ...newCatsToInsert.map(c => c.color)];
          const color = CAT_PALETTE.find(c => !used.includes(c)) || CAT_PALETTE[(categories.length + newCatsToInsert.length) % CAT_PALETTE.length];
          newCatsToInsert.push({ name: catName, color });
        }
        toInsertProducts.push({
          sku: String(r.SKU || r.sku || '') || null, nombre, categoria: catName,
          costo: parseFloat(r.Costo || r.costo) || 0, precio_venta: parseFloat(r.PrecioVenta || r.precioVenta) || 0,
          stock: parseFloat(r.Stock || r.stock) || 0, stock_minimo: parseFloat(r.StockMinimo || r.stockMinimo) || 5,
          unidad: String(r.Unidad || r.unidad || 'unidad'),
        });
      }
      if (newCatsToInsert.length) await supabase.from('categories').insert(newCatsToInsert);
      const { error } = await supabase.from('products').insert(toInsertProducts);
      if (error) { notify('Error al importar: ' + error.message, 'error'); return; }
      notify(`${toInsertProducts.length} productos importados`);
      setImportModal(false);
      fetchCategories(); fetchProducts();
    } catch (e) { notify('No se pudo leer el archivo. Usa la plantilla.', 'error'); }
  }

  async function signOut() { await supabase.auth.signOut(); }

  // ---------- RENDER ----------
  if (session === undefined) return <FullscreenLoader text="Cargando…" />;
  if (session === null) return <Login />;
  if (dataLoading || !profile) return <FullscreenLoader text="Cargando tu inventario…" />;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: C.bg, minHeight: '100vh', color: C.ink }}>
      <div style={{ background: C.brandDark, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={19} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', lineHeight: 1.1 }}>StockClaro</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)' }}>{profile.email} · {profile.role === 'admin' ? 'Administrador' : profile.role === 'editor' ? 'Editor' : 'Solo lectura'}</div>
          </div>
        </div>
        <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Download size={14} /> Exportar Excel
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '10px 16px', background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {[
          ['dashboard', 'Dashboard', LayoutDashboard],
          ['productos', 'Productos', Package],
          ...(canEdit ? [['entrada', 'Entrada', ArrowDownCircle], ['salida', 'Salida', ArrowUpCircle]] : []),
          ['movimientos', 'Movimientos', ShoppingCart],
          ['reportes', 'Utilidad', BarChart3],
          ['config', 'Configuración', SettingsIcon],
        ].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', background: tab === key ? C.brandSoft : 'transparent', color: tab === key ? C.brandDark : C.inkSoft }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'dashboard' && <Dashboard products={products} movements={movements} categories={categories} money={money} setTab={setTab} />}
        {tab === 'productos' && <Productos products={products} categories={categories} canEdit={canEdit} money={money} onNew={openNewProduct} onEdit={openEditProduct} onDelete={(p) => setConfirmDelete({ id: p.id, label: p.nombre })} />}
        {tab === 'entrada' && <RegistrarMovimiento type="entrada" products={products} canEdit={canEdit} userEmail={profile.email} money={money} onConfirm={confirmCartMovement} notify={notify} />}
        {tab === 'salida' && <RegistrarMovimiento type="salida" products={products} canEdit={canEdit} userEmail={profile.email} money={money} onConfirm={confirmCartMovement} notify={notify} />}
        {tab === 'movimientos' && <Movimientos movements={movements} />}
        {tab === 'reportes' && <Reportes products={products} movements={movements} money={money} />}
        {tab === 'config' && <Configuracion categories={categories} products={products} profile={profile} profiles={profiles} isAdmin={isAdmin} canEdit={canEdit} config={config}
          onAddCategory={addCategory} onDeleteCategory={deleteCategory} onChangeCurrency={changeCurrency} onChangeRole={changeRole}
          onExport={exportExcel} onImportClick={() => setImportModal(true)} onTemplate={downloadTemplate} onSignOut={signOut} />}
      </div>

      {productModal && <ProductModal state={productModal} categories={categories} onClose={() => setProductModal(null)} onSave={saveProduct} onAddCategory={addCategory} />}
      {confirmDelete && (
        <Modal title="Confirmar eliminación" onClose={() => setConfirmDelete(null)} width={380}>
          <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 0 }}>¿Eliminar <strong style={{ color: C.ink }}>{confirmDelete.label}</strong>? El historial de movimientos se conservará.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(null)} style={secondaryBtn}>Cancelar</button>
            <button onClick={() => deleteProductConfirmed(confirmDelete.id)} style={{ ...primaryBtn, background: C.danger }}>Eliminar</button>
          </div>
        </Modal>
      )}
      {importModal && <ImportModal onClose={() => setImportModal(false)} onImport={importExcelFile} onTemplate={downloadTemplate} />}

      <Toast toast={toast} />
    </div>
  );
}

function FullscreenLoader({ text }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inkSoft, fontFamily: 'Inter, sans-serif', background: C.bg }}>
      <Loader2 className="animate-spin" size={20} style={{ marginRight: 8 }} /> {text}
    </div>
  );
}
