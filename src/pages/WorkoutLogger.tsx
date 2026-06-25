// src/pages/WorkoutLogger.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, WorkoutLogInsert, Difficulty } from '../types';
import Swal from 'sweetalert2';
import ExerciseFilter from '../components/ExerciseFilter';

const WorkoutLogger = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados para el último peso y su dificultad
  const [lastLog, setLastLog] = useState<{
    weight: number;
    difficulty: Difficulty | null;
  } | null>(null);
  const [loadingLastLog, setLoadingLastLog] = useState(false);

  // Estados de los filtros
  const [filterText, setFilterText] = useState('');
  const [filterSection, setFilterSection] = useState<
    'All' | 'Superior' | 'Inferior'
  >('All');

  // Fetch inicial de todos los ejercicios (sin cambios)
  useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (data) setExercises(data);
      if (error) {
        /* ... manejo de error ... */
      }
      setLoading(false);
    };
    fetchExercises();
  }, []);

  // Effect para buscar el último registro (peso Y dificultad)
  useEffect(() => {
    if (!selectedExId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastLog(null);
      return;
    }

    const fetchLastLog = async () => {
      setLoadingLastLog(true);
      setLastLog(null);

      const { data } = await supabase
        .from('workout_logs')
        .select('weight_kg, difficulty') // <-- AHORA PEDIMOS AMBOS CAMPOS
        .eq('exercise_id', selectedExId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLastLog({
          weight: data.weight_kg,
          difficulty: data.difficulty as Difficulty | null,
        });
      }

      setLoadingLastLog(false);
    };

    fetchLastLog();
  }, [selectedExId]);

  // Lógica de filtrado (sin cambios)
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const sectionMatch =
        filterSection === 'All' || ex.body_section === filterSection;
      const textMatch = ex.name
        .toLowerCase()
        .includes(filterText.toLowerCase());
      return sectionMatch && textMatch;
    });
  }, [exercises, filterText, filterSection]);

  const selectedExercise = exercises.find(
    (ex) => ex.id === parseInt(selectedExId)
  );

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExId || !weight || !difficulty) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Selecciona ejercicio, peso y dificultad.',
        icon: 'warning',
        background: '#1e293b',
        color: '#e2e8f0',
      });
      return;
    }
    setSaving(true);
    const logToInsert: WorkoutLogInsert = {
      exercise_id: parseInt(selectedExId),
      weight_kg: parseFloat(weight),
      difficulty: difficulty,
    };
    const { error } = await supabase.from('workout_logs').insert([logToInsert]);
    setSaving(false);

    if (error) {
      Swal.fire({ title: 'Error' /* ... */ });
    } else {
      Swal.fire({
        title: '¡Guardado!',
        text: 'Tu marca ha sido registrada.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#e2e8f0',
      });
      setWeight('');
      setDifficulty(null); // Reseteamos los botones de dificultad
      // Actualizamos el último log en la UI
      setLastLog({ weight: parseFloat(weight), difficulty: difficulty });
    }
  };

  // --- Objeto para mapear colores, facilita el renderizado ---
  const difficultyStyles: Record<Difficulty, string> = {
    Fácil: 'bg-green-500/10 text-green-400 border-green-500/30',
    Medio: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Difícil: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-slate-200">
        Registrar Marca de Hoy
      </h1>
      <form
        onSubmit={handleSaveLog}
        className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6"
      >
        <ExerciseFilter
          filterText={filterText}
          setFilterText={setFilterText} // <-- Asegúrate de que esta línea esté exactamente aquí
          filterSection={filterSection}
          setFilterSection={setFilterSection}
          itemCount={filteredExercises.length}
        />

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">
            Ejercicio ({filteredExercises.length} encontrados)
          </label>
          <select
            value={selectedExId}
            onChange={(e) => setSelectedExId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
            disabled={loading}
          >
            <option value="">-- Elige un ejercicio --</option>
            {filteredExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {/* --- SECCIÓN DE INFORMACIÓN DEL EJERCICIO CON GRID 2x2 --- */}
        {selectedExercise && (
          <div className="rounded-lg bg-slate-800/50 p-4 text-sm">
            <div className="grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-3">
              {/* Fila 1, Columna 1: Series x Reps */}
              <div className="border-r border-slate-700/50 pr-2 text-center">
                <p className="text-xs text-slate-400">Series x Reps</p>
                <p className="font-bold text-emerald-400">
                  {selectedExercise.sets_reps || 'N/A'}
                </p>
              </div>
              {/* Fila 1, Columna 2: RIR Objetivo */}
              <div className="text-center">
                <p className="text-xs text-slate-400">RIR Objetivo</p>
                <p className="font-bold text-emerald-400">
                  {selectedExercise.rir ?? 'N/A'}
                </p>
              </div>
              {/* Fila 2, Columna 1: Último Peso */}
              <div className="border-t border-r border-slate-700/50 pt-2 pr-2 text-center">
                {loadingLastLog ? (
                  <p className="animate-pulse text-xs text-slate-400">
                    Buscando...
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-slate-400">Último Peso</p>
                    <p className="font-bold text-amber-400">
                      {lastLog ? `${lastLog.weight} kg` : 'N/A'}
                    </p>
                  </>
                )}
              </div>
              {/* Fila 2, Columna 2: Última Dificultad */}
              <div className="border-t border-slate-700/50 pt-2 text-center">
                {loadingLastLog ? (
                  <p className="animate-pulse text-xs text-slate-400">...</p>
                ) : (
                  <>
                    <p className="text-xs text-slate-400">
                      Dificultad Último Peso
                    </p>
                    {lastLog?.difficulty ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${difficultyStyles[lastLog.difficulty]}`}
                      >
                        {lastLog.difficulty}
                      </span>
                    ) : (
                      <p className="font-bold text-slate-500">N/A</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-300">
            Peso Levantado (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Introduce el peso de hoy"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-center text-lg font-bold text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        {/* --- NUEVA SECCIÓN PARA SELECCIONAR DIFICULTAD --- */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            ¿Cómo se sintió el peso?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Fácil', 'Medio', 'Difícil'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border py-2.5 text-sm font-semibold transition-all ${
                  difficulty === d
                    ? `${difficultyStyles[d]} scale-105`
                    : 'border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !selectedExId}
          className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Marca'}
        </button>
      </form>
    </div>
  );
};

export default WorkoutLogger;
