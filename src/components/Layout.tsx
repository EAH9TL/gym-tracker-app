// src/components/Layout.tsx
import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';
import Auth from './Auth';

// --- Iconos para la barra de navegación (sin cambios) ---
const DumbbellIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4 9.6 9.6" /><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l-1.768 1.768a2 2 0 1 1-2.828-2.828l-1.768 1.768a2 2 0 1 1-2.828-2.828" /><path d="m21.5 21.5-1.4-1.4" /><path d="M3.9 3.9 2.5 2.5" /><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l1.768-1.768a2 2 0 1 1-2.828-2.828l1.768-1.768a2 2 0 1 1-2.828-2.829" /></svg>
);
const ChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
);
const ListIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
);
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

// --- Componente de Botón de Navegación reutilizable ---
// MODIFICADO para uso en móvil (columna) y escritorio (fila)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NavItem = ({ to, icon: Icon, children, isMobile = false }: { to: string; icon: React.FC<any>; children: React.ReactNode; isMobile?: boolean }) => {
    const baseClasses = "transition-colors";
    const activeClasses = "text-emerald-400";
    const inactiveClasses = "text-slate-500 hover:text-slate-300";

    const mobileLayout = "flex-1 flex flex-col items-center justify-center gap-1 h-full";
    const desktopLayout = "flex items-center gap-2 text-sm font-bold p-2 rounded-lg";
    
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isMobile ? mobileLayout : desktopLayout}`}
        >
            <Icon className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
            <span className={isMobile ? "text-[10px] font-bold" : ""}>{children}</span>
        </NavLink>
    );
};


const Layout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchSessionAndProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            setProfile(profileData);
        }
        setLoading(false);
    };
    fetchSessionAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) { setProfile(null); } else { fetchSessionAndProfile(); }
    });
    return () => subscription.unsubscribe();
  }, []);
  
  if (loading) {
    // ... (pantalla de carga sin cambios)
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pt-16 md:pt-0 pb-20 md:pb-0">
      {/* --- 1. HEADER MINIMALISTA PARA MÓVIL --- */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center">
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                Gym Tracker 🏋️‍♂️
            </span>
        </div>
      </header>
      {/* --- HEADER DE ESCRITORIO UNIFICADO --- */}
      <header className="hidden md:block bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold text-emerald-400">Gym Tracker 🏋️‍♂️</span>
              <div className="flex items-center gap-2">
                <NavItem to="/" icon={DumbbellIcon}>Registrar</NavItem>
                <NavItem to="/kpis" icon={ChartIcon}>Progreso</NavItem>
                <NavItem to="/exercises" icon={ListIcon}>Ejercicios</NavItem>
              </div>
            </div>
            {/* EL BOTÓN DE LOGOUT SE VA, AHORA TENEMOS EL DE PERFIL */}
            <div className="flex items-center gap-4">
                <NavItem to="/profile" icon={UserIcon}>Mi Cuenta</NavItem>
            </div>
        </nav>
      </header>

      {/* Área de Contenido Principal (sin cambios) */}
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <Outlet context={{ profile, session }} />
      </main>

      {/* --- BARRA DE NAVEGACIÓN INFERIOR PARA MÓVIL (sin cambios) --- */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md z-50 h-16">
          <div className="flex items-center h-full">
          <NavItem to="/" icon={DumbbellIcon} isMobile={true}>Registrar</NavItem>
          <NavItem to="/kpis" icon={ChartIcon} isMobile={true}>Progreso</NavItem>
          <NavItem to="/exercises" icon={ListIcon} isMobile={true}>Ejercicios</NavItem>
          <NavItem to="/profile" icon={UserIcon} isMobile={true}>Cuenta</NavItem>
          </div>
        </nav>
    </div>
  );
};

export default Layout;
