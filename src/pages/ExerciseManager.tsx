import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, ExerciseInsert } from '../types';
import Swal from 'sweetalert2';
import ExerciseFilter from '../components/ExerciseFilter';

const ExerciseManager = () => {
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
  const [filterSection, setFilterSection] = useState<
    'All' | 'Superior' | 'Inferior'
  >('All');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    // ... (sin cambios)
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar el catálogo de ejercicios.',
        icon: 'error',
        background: '#1e293b',
        color: '#e2e8f0',
      });
    } else if (data) {
      setExercises(data);
    }
    setLoading(false);
  };

  const filteredExercises = useMemo(() => {
    // ... (sin cambios)
    return exercises.filter((ex) => {
      const sectionMatch =
        filterSection === 'All' || ex.body_section === filterSection;
      const textMatch = ex.name
        .toLowerCase()
        .includes(filterText.toLowerCase());
      return sectionMatch && textMatch;
    });
  }, [exercises, filterText, filterSection]);

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({
        title: 'Inválido',
        text: 'El nombre es obligatorio.',
        icon: 'warning',
        background: '#1e293b',
        color: '#e2e8f0',
      });
      return;
    }

    setIsSaving(true);
    const exercisePayload: ExerciseInsert = {
      name: name.trim(),
      body_section: section,
      notes: notes.trim() || undefined,
      sets_reps: setsReps.trim() || undefined,
      rir: rir ? parseInt(rir) : undefined,
    };
    const { error } = editingExId
      ? await supabase
          .from('exercises')
          .update(exercisePayload)
          .eq('id', editingExId)
      : await supabase.from('exercises').insert([exercisePayload]);
    setIsSaving(false);

    if (error) {
      Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        background: '#1e293b',
        color: '#e2e8f0',
      });
    } else {
      Swal.fire({
        title: '¡Éxito!',
        text: 'Ejercicio guardado.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#e2e8f0',
      });
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
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-slate-200 sm:text-3xl">
          Catálogo de Ejercicios
        </h1>
        {/* BOTÓN PARA ABRIR EL MODAL DE CREACIÓN */}
        <button
          onClick={handleCreateNew}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 sm:w-auto"
        >
          ➕ Crear Nuevo Ejercicio
        </button>
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
          <p className="py-8 text-center text-slate-400">
            Cargando ejercicios...
          </p>
        ) : (
          filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-grow">
                <p className="font-bold text-slate-100">{ex.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ex.body_section === 'Superior' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'}`}
                  >
                    {ex.body_section}
                  </span>
                  {ex.notes && (
                    <span className="ml-2 italic">“{ex.notes}”</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleEdit(ex)}
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 sm:mt-0 sm:w-auto sm:border-transparent"
              >
                Editar
              </button>
            </div>
          ))
        )}
        {/* ... mensajes de 'no hay resultados' ... */}
        {!loading && exercises.length > 0 && filteredExercises.length === 0 && (
          <p className="py-8 text-center text-slate-500">
            No se encontraron ejercicios con los filtros aplicados.
          </p>
        )}
      </div>

      {/* --- EL MODAL --- */}
      {isModalOpen && (
        // Overlay (fondo oscuro)
        <div
          onClick={closeModal} // Cierra el modal al hacer clic en el fondo
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          {/* Contenedor del Modal */}
          <div
            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal se propague al fondo
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingExId
                  ? '✏️ Editar Ejercicio'
                  : '➕ Crear Nuevo Ejercicio'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Formulario dentro del modal */}
            <form onSubmit={handleSaveExercise} className="space-y-4">
              {/* Input de Nombre (sin cambios) */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Press de Banca"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"
                />
              </div>

              {/* --- NUEVOS CAMPOS PARA SETS/REPS y RIR --- */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                    Sets x Reps
                  </label>
                  <input
                    type="text"
                    value={setsReps}
                    onChange={(e) => setSetsReps(e.target.value)}
                    placeholder="Ej. 3x10"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                    RIR Objetivo
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={rir}
                    onChange={(e) => setRir(e.target.value)}
                    placeholder="Ej. 2"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"
                  />
                </div>
              </div>

              {/* Botones de Sección (sin cambios) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSection('Superior')}
                  className={`rounded-lg border py-2.5 text-sm font-semibold transition-colors ${section === 'Superior' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:bg-slate-800/80'}`}
                >
                  Tren Superior 💪
                </button>
                <button
                  type="button"
                  onClick={() => setSection('Inferior')}
                  className={`rounded-lg border py-2.5 text-sm font-semibold transition-colors ${section === 'Inferior' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:bg-slate-800/80'}`}
                >
                  Tren Inferior 🦵
                </button>
              </div>

              {/* Input de Notas (sin cambios) */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Notas (Opcional)
                </label>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Mantener retracción escapular"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"
                />
              </div>

              {/* Botón de Guardar (sin cambios) */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
              >
                {isSaving
                  ? 'Guardando...'
                  : editingExId
                    ? 'Actualizar Ejercicio'
                    : 'Añadir al Catálogo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseManager;
