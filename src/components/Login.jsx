import React, { useState } from 'react';
import { Boxes, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import { C } from '../lib/helpers.js';
import { inputStyle, primaryBtn, Field } from '../ui.jsx';

export default function Login() {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ type: 'error', text: traducirError(error.message) });
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg({ type: 'error', text: traducirError(error.message) });
      else setMsg({ type: 'ok', text: 'Cuenta creada. Si tu proyecto pide confirmación, revisa tu correo antes de iniciar sesión.' });
    }
    setLoading(false);
  }

  function traducirError(m) {
    if (m.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (m.includes('User already registered')) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
    if (m.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
    return m;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: 'Inter, sans-serif', padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 12px 40px rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: C.brandDark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={21} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 19 }}>StockClaro</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft }}>Inventario en la nube</div>
          </div>
        </div>

        <div className="flex gap-2" style={{ marginBottom: 18 }}>
          <button type="button" onClick={() => setMode('signin')} style={tabBtn(mode === 'signin')}>Iniciar sesión</button>
          <button type="button" onClick={() => setMode('signup')} style={tabBtn(mode === 'signup')}>Crear cuenta</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Correo electrónico">
            <input required type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </Field>
          <Field label="Contraseña">
            <input required type="password" minLength={6} style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </Field>
          {msg && <div style={{ fontSize: 13, color: msg.type === 'error' ? C.danger : C.ok, marginBottom: 12 }}>{msg.text}</div>}
          <button disabled={loading} type="submit" style={{ ...primaryBtn, width: '100%', justifyContent: 'center', opacity: loading ? .6 : 1 }}>
            {loading && <Loader2 size={15} className="animate-spin" />} {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
        {mode === 'signup' && <p style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 14, marginBottom: 0 }}>La primera persona en registrarse queda como administrador automáticamente.</p>}
      </div>
    </div>
  );
}
function tabBtn(active) {
  return { flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: active ? '#E4F0EC' : 'transparent', color: active ? '#0B4A41' : '#5C6B67' };
}
