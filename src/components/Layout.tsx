// src/components/Layout.tsx
import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';
import Auth from './Auth';

const Layout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar el menú en pantallas móviles
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
      } else {
         fetchSessionAndProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-semibold text-sm text-slate-400">Cargando sesión...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      
      {/* HEADER RESPONSIVO */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-3.5">
          <div className="flex justify-between items-center">
            
            {/* Logo y menú de escritorio */}
            <div className="flex items-center gap-8">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                Gym Tracker 🏋️‍♂️
              </span>
              
              {/* Navegación para computadoras (MD en adelante) */}
              <div className="hidden md:flex items-center gap-6">
                <NavLink to="/" className={({ isActive }) => `text-sm font-bold transition-all duration-200 ${isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                  Registrar Marca
                </NavLink>
                <NavLink to="/kpis" className={({ isActive }) => `text-sm font-bold transition-all duration-200 ${isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                  KPIs y Progreso
                </NavLink>
                {profile?.is_admin && (
                  <NavLink to="/exercises" className={({ isActive }) => `text-sm font-bold transition-all duration-200 ${isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                    Gestionar Ejercicios
                  </NavLink>
                )}
              </div>
            </div>

            {/* Email y botón cerrar sesión en escritorio */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-xs text-slate-500">{session.user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="bg-rose-500/10 text-rose-400 text-xs font-extrabold px-4 py-2 rounded-lg hover:bg-rose-500/20 active:scale-95 transition"
              >
                Cerrar Sesión
              </button>
            </div>

            {/* Botón de Menú Hamburguesa para Móvil (Solo visible en pantallas pequeñas) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-400 hover:text-white focus:outline-none p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/50"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

          </div>

          {/* MENÚ DESPLEGABLE MÓVIL */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
              <NavLink 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `block text-sm font-bold p-2.5 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400 font-black' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Registrar Marca
              </NavLink>
              <NavLink 
                to="/kpis" 
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `block text-sm font-bold p-2.5 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400 font-black' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                KPIs y Progreso
              </NavLink>
              {profile?.is_admin && (
                <NavLink 
                  to="/exercises" 
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) => `block text-sm font-bold p-2.5 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400 font-black' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Gestionar Ejercicios
                </NavLink>
              )}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <span className="text-xs text-slate-500 px-2.5 break-all">{session.user.email}</span>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    supabase.auth.signOut();
                  }} 
                  className="w-full bg-rose-500/10 text-rose-400 text-sm font-extrabold py-2.5 rounded-lg hover:bg-rose-500/20 text-center transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* ÁREA DE CONTENIDO PRINCIPAL RESPONSIVO */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <Outlet context={{ profile }} />
      </main>

    </div>
  );
};

export default Layout;
