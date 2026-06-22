// src/pages/WorkoutLogger.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, WorkoutLogInsert } from '../types';
import Swal from 'sweetalert2';

const WorkoutLogger = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Estados del formulario
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [saving, setSaving] = useState(false);

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
    };
    fetchExercises();
  }, []);
  
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExId || !weight) {
        Swal.fire({ title: 'Campos incompletos', text: 'Por favor, rellena todos los datos de la serie.', icon: 'warning', background: '#1e293b', color: '#e2e8f0' });
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
        Swal.fire({ title: '¡Guardado!', text: 'Tu marca ha sido registrada con éxito.', icon: 'success', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#e2e8f0' });
        // Limpiar formulario
        setSelectedExId('');
        setWeight('');
    }
  };


  return (
    <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-200">Registrar Marca de Hoy</h1>
        <form onSubmit={handleSaveLog} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
             <div>
                <label className="block text-sm font-semibold mb-1 text-slate-300">Ejercicio</label>
                <select value={selectedExId} onChange={e => setSelectedExId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500">
                    <option value="">-- Elige un ejercicio --</option>
                    {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
   <div>
       <label className="block text-sm font-semibold mb-1 text-slate-300">Peso (kg)</label>
       <input type="number" step="any" value={weight} onChange={e => setWeight(e.target.value)} placeholder="60.5" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500"/>
   </div>
</div>
             <button type="submit" disabled={saving} className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar Marca'}
             </button>
        </form>
    </div>
  );
};
export default WorkoutLogger;
