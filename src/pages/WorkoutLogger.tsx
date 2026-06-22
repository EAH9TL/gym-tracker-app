import { useState, useEffect, useMemo } from 'react'; // Importamos useMemo
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

  // --- NUEVOS ESTADOS PARA LOS FILTROS ---
  const [filterText, setFilterText] = useState('');
  const [filterSection, setFilterSection] = useState<'All' | 'Superior' | 'Inferior'>('All');

  useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (data) setExercises(data);
      if(error) {
        Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        background: '#1e293b',
        color: '#e2e8f0'
        });
      }
      setLoading(false);
    };
    fetchExercises();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const sectionMatch = filterSection === 'All' || ex.body_section === filterSection;
      const textMatch = ex.name.toLowerCase().includes(filterText.toLowerCase());
      return sectionMatch && textMatch;
    });
  }, [exercises, filterText, filterSection]);

  // Encontrar el ejercicio seleccionado para mostrar sus detalles
  const selectedExercise = exercises.find(ex => ex.id === parseInt(selectedExId));

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExId || !weight) {
        Swal.fire({ title: 'Campos incompletos', text: 'Selecciona un ejercicio y anota el peso.', icon: 'warning', background: '#1e293b', color: '#e2e8f0' });
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
        Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1e293b', color: '#e2e8f0' });
    } else {
        Swal.fire({ title: '¡Guardado!', text: 'Tu marca ha sido registrada con éxito.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#e2e8f0' });
        setWeight('');
        // Opcional: podrías no resetear el ejercicio seleccionado si quieres registrar varias series del mismo
        // setSelectedExId(''); 
    }
  };

  return (
    <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-200">Registrar Marca de Hoy</h1>
        <form onSubmit={handleSaveLog} className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-xl space-y-4">
             
            <ExerciseFilter 
              filterText={filterText} 
              setFilterText={setFilterText} 
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
                    {/* AHORA MAPEAMOS SOBRE LA LISTA FILTRADA */}
                    {filteredExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
             </div>

             {selectedExercise && (
                <div className="bg-slate-800/50 p-3 rounded-lg text-sm text-center grid grid-cols-2 gap-2">
                    <p>Series x Reps: <span className="font-bold text-emerald-400">{selectedExercise.sets_reps || 'N/A'}</span></p>
                    <p>RIR Objetivo: <span className="font-bold text-emerald-400">{selectedExercise.rir ?? 'N/A'}</span></p>
                </div>
             )}

             <div>
                <label className="block text-sm font-semibold mb-1 text-slate-300">Peso Levantado (kg)</label>
                <input type="number" step="any" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Introduce el peso de hoy" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-center text-lg font-bold text-slate-100 outline-none focus:border-emerald-500"/>
             </div>

             <button type="submit" disabled={saving || !selectedExId} className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 active:scale-95">
                {saving ? 'Guardando...' : 'Guardar Marca'}
             </button>
        </form>
    </div>
  );
};
export default WorkoutLogger;
