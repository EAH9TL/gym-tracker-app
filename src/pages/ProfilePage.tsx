import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router';
import type { Profile } from '../types'; 
import type { Session } from '@supabase/supabase-js';

const ProfilePage = () => {
  // Obtenemos la sesión y el perfil directamente desde el Layout
  const { profile, session } = useOutletContext<{ profile: Profile | null, session: Session | null }>();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-200">
        Mi Cuenta
      </h1>
      
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Sesión iniciada como:</p>
          {/* Leemos el email desde el objeto session del contexto */}
          <p className="font-semibold text-slate-100 break-all">{session?.user?.email}</p>
        </div>

        {profile?.is_admin && (
          <div className="flex justify-center">
            <span className="bg-purple-500/10 text-purple-400 text-sm font-bold px-4 py-1.5 rounded-full border border-purple-500/20">
              Rol: Administrador
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-rose-500/10 text-rose-400 font-extrabold py-3 rounded-lg hover:bg-rose-500/20 active:scale-95 transition"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
