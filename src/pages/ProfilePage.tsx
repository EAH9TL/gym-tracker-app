import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router';
import type { Profile } from '../types';
import type { Session } from '@supabase/supabase-js';

const ProfilePage = () => {
  // Obtenemos la sesión y el perfil directamente desde el Layout
  const { profile, session } = useOutletContext<{
    profile: Profile | null;
    session: Session | null;
  }>();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="mb-4 text-2xl font-bold text-slate-200 sm:text-3xl">
        Mi Cuenta
      </h1>

      <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Sesión iniciada como:</p>
          {/* Leemos el email desde el objeto session del contexto */}
          <p className="font-semibold break-all text-slate-100">
            {session?.user?.email}
          </p>
        </div>

        {profile?.is_admin && (
          <div className="flex justify-center">
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm font-bold text-purple-400">
              Rol: Administrador
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-rose-500/10 py-3 font-extrabold text-rose-400 transition hover:bg-rose-500/20 active:scale-95"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
