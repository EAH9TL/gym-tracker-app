// src/pages/ExerciseManager.tsx
import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router';
import { supabase } from '../supabaseClient';
import type { Profile, Exercise, ExerciseInsert } from '../types';
import Swal from 'sweetalert2';
import ExerciseFilter from '../components/ExerciseFilter';

const ExerciseManager = () => {
  const { profile } = useOutletContext<{ profile: Profile | null }>();

  // Estados de datos y UI
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO PARA CONTROLAR EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados del formulario (ahora dentro del modal)
  const [editingExId, setEditingExId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [section, setSection] = useState<'Superior' | 'Inferior'>('Superior');
  const [notes, setNotes] = useState('');
  const [setsReps, setSetsReps] = useState('');
  const [rir, setRir] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estados para los filtros
  const [filterText, setFilterText] = useState('');
  const [filterSection, setFilterSection] = useState<'All' | 'Superior' | 'Inferior'>('All');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    // ... (sin cambios)
    setLoading(true);
    const { data, error } = await supabase.from('exercises').select('*').order('name', { ascending: true });
    if (error) {
        Swal.fire({ title: 'Error', text: 'No se pudo cargar el catálogo de ejercicios.', icon: 'error', background: '#1e293b', color: '#e2e8f0' });
    } else if (data) {
        setExercises(data);
    }
    setLoading(false);
  };

  const filteredExercises = useMemo(() => {
    // ... (sin cambios)
    return exercises.filter(ex => {
        const sectionMatch = filterSection === 'All' || ex.body_section === filterSection;
        const textMatch = ex.name.toLowerCase().includes(filterText.toLowerCase());
        return sectionMatch && textMatch;
    });
  }, [exercises, filterText, filterSection]);

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... (resto de la lógica de guardado sin cambios)
    if (!profile?.is_admin) return;
    if (!name.trim()) {
      Swal.fire({ title: 'Inválido', text: 'El nombre es obligatorio.', icon: 'warning', background: '#1e293b', color: '#e2e8f0' });
      return;
    }

    setIsSaving(true);
    const exercisePayload: ExerciseInsert = { 
        name: name.trim(), 
        body_section: section, 
        notes: notes.trim() || undefined, 
        sets_reps: setsReps.trim() || undefined,
        rir: rir ? parseInt(rir) : undefined 
    };
    const { error } = editingExId
      ? await supabase.from('exercises').update(exercisePayload).eq('id', editingExId)
      : await supabase.from('exercises').insert([exercisePayload]);
    setIsSaving(false);

    if (error) {
      Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1e293b', color: '#e2e8f0' });
    } else {
      Swal.fire({ title: '¡Éxito!', text: 'Ejercicio guardado.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#e2e8f0' });
      closeModal();
      fetchExercises();
    }
  };
  
  // --- FUNCIONES PARA MANEJAR EL MODAL ---

  // Abre el modal para crear un nuevo ejercicio
  const handleCreateNew = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  // Abre el modal para editar un ejercicio existente
  const handleEdit = (exercise: Exercise) => {
    setEditingExId(exercise.id);
    setName(exercise.name);
    setSection(exercise.body_section);
    setNotes(exercise.notes || '');
    setSetsReps(exercise.sets_reps || '');
    setRir(exercise.rir?.toString() || '');
    setIsModalOpen(true);
  };

  // Cierra el modal y resetea el estado del formulario
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingExId(null);
    setName('');
    setSection('Superior');
    setNotes('');
    setSetsReps('');
    setRir('');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-200">
          Catálogo de Ejercicios
        </h1>
        {/* BOTÓN PARA ABRIR EL MODAL DE CREACIÓN */}
        {profile?.is_admin && (
          <button
            onClick={handleCreateNew}
            className="w-full sm:w-auto bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-lg transition hover:bg-emerald-400 active:scale-95 text-sm"
          >
            ➕ Crear Nuevo Ejercicio
          </button>
        )}
      </div>

      <ExerciseFilter
                filterText={filterText}
                setFilterText={setFilterText}
                filterSection={filterSection}
                setFilterSection={setFilterSection}
                itemCount={filteredExercises.length}
            />

      {/* Lista de ejercicios filtrados (el botón ahora llama a handleEdit) */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Cargando ejercicios...</p>
        ) : (
          filteredExercises.map(ex => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex-grow">
                <p className="font-bold text-slate-100">{ex.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                    <span className={`font-semibold rounded-full px-2 py-0.5 text-xs ${ex.body_section === 'Superior' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'}`}>{ex.body_section}</span>
                    {ex.notes && <span className="ml-2 italic">“{ex.notes}”</span>}
                </p>
              </div>
              {profile?.is_admin && (
                <button onClick={() => handleEdit(ex)} className="w-full sm:w-auto text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-md transition-colors border border-slate-700 sm:border-transparent mt-2 sm:mt-0">
                  Editar
                </button>
              )}
            </div>
          ))
        )}
        {/* ... mensajes de 'no hay resultados' ... */}
         {!loading && exercises.length > 0 && filteredExercises.length === 0 && (
             <p className="text-center text-slate-500 py-8">No se encontraron ejercicios con los filtros aplicados.</p>
        )}
      </div>

      {/* --- EL MODAL --- */}
      {isModalOpen && (
        // Overlay (fondo oscuro)
        <div 
            onClick={closeModal} // Cierra el modal al hacer clic en el fondo
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Contenedor del Modal */}
          <div 
            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal se propague al fondo
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editingExId ? '✏️ Editar Ejercicio' : '➕ Crear Nuevo Ejercicio'}</h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            
            {/* Formulario dentro del modal */}
            <form onSubmit={handleSaveExercise} className="space-y-4">
    {/* Input de Nombre (sin cambios) */}
    <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-300">Nombre</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Press de Banca" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"/>
    </div>
    
    {/* --- NUEVOS CAMPOS PARA SETS/REPS y RIR --- */}
    <div className="grid grid-cols-2 gap-3">
        <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-300">Sets x Reps</label>
            <input type="text" value={setsReps} onChange={e => setSetsReps(e.target.value)} placeholder="Ej. 3x10" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"/>
        </div>
        <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-300">RIR Objetivo</label>
            <input type="number" value={rir} onChange={e => setRir(e.target.value)} placeholder="Ej. 2" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"/>
        </div>
    </div>
    
    {/* Botones de Sección (sin cambios) */}
    <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setSection('Superior')} className={`py-2.5 rounded-lg font-semibold text-sm border transition-colors ${section === 'Superior' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'border-slate-700 hover:bg-slate-800/80'}`}>Tren Superior 💪</button>
        <button type="button" onClick={() => setSection('Inferior')} className={`py-2.5 rounded-lg font-semibold text-sm border transition-colors ${section === 'Inferior' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'border-slate-700 hover:bg-slate-800/80'}`}>Tren Inferior 🦵</button>
    </div>

    {/* Input de Notas (sin cambios) */}
    <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-300">Notas (Opcional)</label>
        <textarea rows={5}  value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Mantener retracción escapular" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"/>
    </div>

    {/* Botón de Guardar (sin cambios) */}
    <button type="submit" disabled={isSaving} className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 active:scale-95">
        {isSaving ? 'Guardando...' : (editingExId ? 'Actualizar Ejercicio' : 'Añadir al Catálogo')}
    </button>
</form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseManager;
