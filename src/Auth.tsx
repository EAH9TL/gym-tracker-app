// src/Auth.tsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage('Error de registro: ' + error.message);
      } else {
        setMessage('¡Registro exitoso! Por favor inicia sesión.');
        setIsRegistering(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('Error de login: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl backdrop-blur-md">
        <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-6">
          {isRegistering ? 'Crear Cuenta 🏋️‍♂️' : 'Iniciar Sesión 🔑'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : isRegistering ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-amber-400">{message}</p>}

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="mt-6 w-full text-center text-xs text-slate-400 hover:text-slate-200 transition underline"
        >
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
        </button>
      </div>
    </div>
  );
}
