// src/components/Auth.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2'; // <-- 1. IMPORTAR sweetalert2

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  // const [message, setMessage] = useState(''); // <-- 2. ELIMINAMOS el estado message

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      // --- Lógica de Registro ---
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        // 3. REEMPLAZAMOS setMessage por Swal.fire para errores
        Swal.fire({
          title: 'Error de registro',
          text: error.message,
          icon: 'error',
          background: '#1e293b', // bg-slate-800
          color: '#e2e8f0',      // text-slate-200
          confirmButtonColor: '#10b981' // emerald-500
        });
      } else {
        // 4. REEMPLAZAMOS setMessage por Swal.fire para éxito
        Swal.fire({
          title: '¡Registro exitoso!',
          text: 'Hemos enviado un enlace de confirmación a tu correo. Por favor, haz clic en él para activar tu cuenta.',
          icon: 'success',
          background: '#1e293b',
          color: '#e2e8f0',
          confirmButtonColor: '#10b981'
        });
        setIsRegistering(false); // Cambiamos a la vista de login
      }
    } else {
      // --- Lógica de Login ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Swal.fire({
          title: 'Error de inicio de sesión',
          text: error.message,
          icon: 'error',
          background: '#1e293b',
          color: '#e2e8f0',
          confirmButtonColor: '#10b981'
        });
      }
      // Si el login es exitoso, el onAuthStateChange del Layout se encargará de redirigir.
      // No es necesario mostrar un Swal de éxito aquí.
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
              inputMode='email'
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
              placeholder="contraseña"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Procesando...' : isRegistering ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
        
        {/* 5. ELIMINAMOS el párrafo que mostraba el mensaje */}
        {/* {message && <p className="mt-4 text-center text-sm text-amber-400">{message}</p>} */}
        
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
