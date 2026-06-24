// src/pages/WorkoutLogger.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, WorkoutLogInsert } from '../types';
import Swal from 'sweetalert2';
import ExerciseFilter from '../components/ExerciseFilter';

const WorkoutLogger = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // --- NUEVOS ESTADOS PARA MOSTRAR EL ÚLTIMO PESO ---
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [loadingLastWeight, setLoadingLastWeight] = useState(false);

  // Estados de los filtros
  const [filterText, setFilterText] = useState('');
  const [filterSection, setFilterSection] = useState<'All' | 'Superior' | 'Inferior'>('All');

  // Fetch inicial de todos los ejercicios (sin cambios)
  useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (data) setExercises(data);
      if(error) { /* ... manejo de error ... */ }
      setLoading(false);
    };
    fetchExercises();
  }, []);

  // --- NUEVO EFFECT PARA BUSCAR EL ÚLTIMO PESO ---
  // Se dispara cada vez que cambia el ejercicio seleccionado
  useEffect(() => {
    // Si no hay un ejercicio seleccionado, reseteamos el estado y no hacemos nada
    if (!selectedExId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastWeight(null);
      return;
    }

    const fetchLastWeight = async () => {
      setLoadingLastWeight(true);
      setLastWeight(null); // Limpiamos el peso anterior mientras carga

      const { data } = await supabase
        .from('workout_logs')
        .select('weight_kg') // Solo necesitamos la columna del peso
        .eq('exercise_id', selectedExId) // Del ejercicio seleccionado
        .order('created_at', { ascending: false }) // Ordenamos por fecha, el más reciente primero
        .limit(1) // Solo queremos el primer resultado (el más reciente)
        .single(); // Obtenemos un solo objeto en lugar de un array

      if (data) {
        setLastWeight(data.weight_kg);
      }
      // Si hay un error o no hay datos, lastWeight se quedará en null
      
      setLoadingLastWeight(false);
    };

    fetchLastWeight();
  }, [selectedExId]); // La dependencia es el ID del ejercicio seleccionado


  // Lógica de filtrado (sin cambios)
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const sectionMatch = filterSection === 'All' || ex.body_section === filterSection;
      const textMatch = ex.name.toLowerCase().includes(filterText.toLowerCase());
      return sectionMatch && textMatch;
    });
  }, [exercises, filterText, filterSection]);

  const selectedExercise = exercises.find(ex => ex.id === parseInt(selectedExId));

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExId || !weight) {
        Swal.fire({ title: 'Campos incompletos', /* ... */ });
        return;
    }
    setSaving(true);
    const logToInsert: WorkoutLogInsert = {
        exercise_id: parseInt(selectedExId),
        weight_kg: parseFloat(weight),
    };
    const { error } = await supabase.from('workout_logs').insert([logToInsert]);
    setSaving(false);

    if (error) {
        Swal.fire({ title: 'Error', /* ... */ });
    } else {
        Swal.fire({ title: '¡Guardado!', /* ... */ });
        setWeight('');
        // --- ACTUALIZAMOS EL ÚLTIMO PESO EN LA UI ---
        // Para que se refleje inmediatamente sin necesidad de volver a seleccionar
        setLastWeight(parseFloat(weight));
    }
  };

  return (
    <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-200">Registrar Marca de Hoy</h1>
        <form onSubmit={handleSaveLog} className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-xl space-y-4">
            
            <ExerciseFilter 
             filterText={filterText} 
             setFilterText={setFilterText} // <-- Asegúrate de que esta línea esté exactamente aquí
             filterSection={filterSection} 
             setFilterSection={setFilterSection} 
             itemCount={filteredExercises.length}
            />
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-300">Ejercicio ({filteredExercises.length} encontrados)</label>
              <select 
                  value={selectedExId} 
                  onChange={e => setSelectedExId(e.target.value)} 
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
                  disabled={loading}
              >
                  <option value="">-- Elige un ejercicio --</option>
                  {filteredExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>
            
            {/* --- SECCIÓN DE INFORMACIÓN DEL EJERCICIO ACTUALIZADA --- */}
            {selectedExercise && (
                <div className="bg-slate-800/50 p-3 rounded-lg text-sm text-center grid grid-cols-2 md:grid-cols-3 gap-2">
                    <p>Series x Reps: <span className="font-bold text-emerald-400">{selectedExercise.sets_reps || 'N/A'}</span></p>
                    <p>RIR Objetivo: <span className="font-bold text-emerald-400">{selectedExercise.rir ?? 'N/A'}</span></p>
                    {/* Nuevo indicador de último peso */}
                    <div className="col-span-2 md:col-span-1 mt-2 md:mt-0 pt-2 md:pt-0 border-t border-slate-700/50 md:border-none">
                        {loadingLastWeight ? (
                            <p className="text-slate-400 animate-pulse">Buscando...</p>
                        ) : (
                            <p>Último Peso: <span className="font-bold text-amber-400">{lastWeight !== null ? `${lastWeight} kg` : 'N/A'}</span></p>
                        )}
                    </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-300">Peso Levantado (kg)</label>
              <input type="number" inputMode='decimal' step="0.5" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Introduce el peso de hoy" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-center text-lg font-bold text-slate-100 outline-none focus:border-emerald-500"/>
            </div>

            <button type="submit" disabled={saving || !selectedExId} className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 active:scale-95">
              {saving ? 'Guardando...' : 'Guardar Marca'}
            </button>
        </form>
    </div>
  );
};

export default WorkoutLogger;
