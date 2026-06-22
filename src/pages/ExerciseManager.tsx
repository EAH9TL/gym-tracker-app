// src/pages/ExerciseManager.tsx
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { supabase } from '../supabaseClient';
import type { Profile, Exercise, ExerciseInsert } from '../types';
import Swal from 'sweetalert2';

const ExerciseManager = () => {
  const { profile } = useOutletContext<{ profile: Profile | null }>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [editingExId, setEditingExId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [section, setSection] = useState<'Superior' | 'Inferior'>('Superior');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchExercises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      Swal.fire({ title: 'Error', text: 'No se pudo cargar el catálogo de ejercicios.', icon: 'error', background: '#1e293b', color: '#e2e8f0' });
    } else if (data) {
      setExercises(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExercises();
  }, []);


  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.is_admin) {
      Swal.fire({ title: 'Acceso denegado', text: 'Solo los administradores pueden modificar el catálogo.', icon: 'error', background: '#1e293b', color: '#e2e8f0' });
      return;
    }
    if (!name.trim()) {
      Swal.fire({ title: 'Inválido', text: 'El nombre del ejercicio es obligatorio.', icon: 'warning', background: '#1e293b', color: '#e2e8f0' });
      return;
    }

    setIsSaving(true);
    const exercisePayload: ExerciseInsert = {
      name: name.trim(),
      body_section: section,
      notes: notes.trim() || undefined,
    };

    let error;
    if (editingExId) {
      const { error: updateError } = await supabase.from('exercises').update(exercisePayload).eq('id', editingExId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('exercises').insert([exercisePayload]);
      error = insertError;
    }
    setIsSaving(false);

    if (error) {
      Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1e293b', color: '#e2e8f0' });
    } else {
      Swal.fire({
        title: editingExId ? '¡Actualizado!' : '¡Creado!',
        text: `El ejercicio "${name.trim()}" ha sido guardado.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#e2e8f0'
      });
      resetForm();
      fetchExercises();
    }
  };
  
  // OPTIMIZADO: Al empezar a editar, hacemos scroll suave hacia el formulario
  const startEditing = (exercise: Exercise) => {
    setEditingExId(exercise.id);
    setName(exercise.name);
    setSection(exercise.body_section);
    setNotes(exercise.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingExId(null);
    setName('');
    setSection('Superior');
    setNotes('');
  };

  return (
    <div>
      {/* Título responsivo, más pequeño en móvil */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-200">
        Gestor del Catálogo
      </h1>

      {/* Formulario (solo para Admin) con espaciado responsivo */}
      {profile?.is_admin && (
        <form onSubmit={handleSaveExercise} className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-xl mb-8 space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-semibold">{editingExId ? '✏️ Editando Ejercicio' : '➕ Crear Nuevo Ejercicio'}</h2>
             {editingExId && (
                <button type="button" onClick={resetForm} className="text-xs text-rose-400 hover:underline">Cancelar Edición</button>
             )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-300">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Press de Banca" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button type="button" onClick={() => setSection('Superior')} className={`py-2.5 rounded-lg font-semibold text-sm border transition-colors ${section === 'Superior' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'border-slate-700 hover:bg-slate-800/80'}`}>Tren Superior 💪</button>
             <button type="button" onClick={() => setSection('Inferior')} className={`py-2.5 rounded-lg font-semibold text-sm border transition-colors ${section === 'Inferior' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'border-slate-700 hover:bg-slate-800/80'}`}>Tren Inferior 🦵</button>
          </div>
           <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-300">Notas (Opcional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Mantener retracción escapular" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"/>
          </div>
          <button type="submit" disabled={isSaving} className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 active:scale-95">
            {isSaving ? 'Guardando...' : (editingExId ? 'Actualizar Ejercicio' : 'Añadir al Catálogo')}
          </button>
        </form>
      )}

      {/* Lista de ejercicios con layout responsivo */}
      <div className="space-y-3">
        {loading ? (
            <p className="text-center text-slate-400 py-8">Cargando ejercicios...</p>
        ) : (
            exercises.map(ex => (
                // OPTIMIZADO: La tarjeta ahora es un flex container que cambia de dirección
                <div key={ex.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    {/* Contenido principal del ejercicio */}
                    <div className="flex-grow">
                        <p className="font-bold text-slate-100">{ex.name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            <span className={`font-semibold rounded-full px-2 py-0.5 text-xs ${ex.body_section === 'Superior' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'}`}>{ex.body_section}</span>
                            {ex.notes && <span className="ml-2 italic">“{ex.notes}”</span>}
                        </p>
                    </div>
                    {/* Botón de edición, se adapta al layout responsivo */}
                    {profile?.is_admin && (
                        // OPTIMIZADO: El botón tiene ancho completo en móvil para ser fácil de tocar
                        <button 
                            onClick={() => startEditing(ex)} 
                            className="w-full sm:w-auto text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-md transition-colors border border-slate-700 sm:border-transparent mt-2 sm:mt-0"
                        >
                            Editar
                        </button>
                    )}
                </div>
            ))
        )}
        {!loading && exercises.length === 0 && (
             <p className="text-center text-slate-500 py-8">No hay ejercicios en el catálogo. ¡Crea el primero!</p>
        )}
      </div>
    </div>
  );
};

export default ExerciseManager;
