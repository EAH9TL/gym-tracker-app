// src/pages/KpiDashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, WorkoutLog } from '../types';

const KpiDashboard = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar el catálogo de ejercicios para el selector
  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase.from('exercises').select('*').order('name');
      if (data) setExercises(data);
      setLoading(false);
    };
    fetchExercises();
  }, []);

  // Cuando se selecciona un ejercicio, cargar su historial
  useEffect(() => {
    if (selectedExId) {
      const fetchHistory = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('exercise_id', selectedExId)
          .order('created_at', { ascending: false }); // Más recientes primero
        if (data) setHistory(data);
        setLoading(false);
      };
      fetchHistory();
    }
  }, [selectedExId]);

  // Calcular KPIs usando useMemo para que no se recalcule en cada render
  const kpis = useMemo(() => {
    if (history.length === 0) {
      return { maxWeight: 0, lastWeight: 0, totalSessions: 0, firstWeight: 0 };
    }
    const weights = history.map(log => log.weight_kg);
    const maxWeight = Math.max(...weights);
    const lastWeight = history[0].weight_kg; // El más reciente
    const firstWeight = history[history.length - 1].weight_kg; // El más antiguo

    return { maxWeight, lastWeight, totalSessions: history.length, firstWeight };
  }, [history]);

  const progressPercentage = useMemo(() => {
     if (kpis.firstWeight === 0 || kpis.lastWeight <= kpis.firstWeight) return 0;
     return ((kpis.lastWeight - kpis.firstWeight) / kpis.firstWeight) * 100;
  }, [kpis]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-200">KPIs y Progreso por Ejercicio</h1>

      <div className="max-w-xl mx-auto mb-8">
        <label className="block text-sm font-semibold mb-1 text-slate-300">Selecciona un ejercicio para ver su progreso</label>
        <select value={selectedExId} onChange={e => setSelectedExId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500">
            <option value="">-- Analizar ejercicio --</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>

      {loading && selectedExId && <p className="text-center text-slate-400">Cargando datos...</p>}

      {!selectedExId && <p className="text-center text-slate-500 mt-10">Elige un ejercicio para comenzar el análisis.</p>}

      {selectedExId && !loading && (
        history.length === 0 ? (
            <p className="text-center text-slate-500 mt-10">No hay registros para este ejercicio todavía.</p>
        ) : (
          <div>
            {/* Tarjetas de KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCard title="Récord Máximo" value={`${kpis.maxWeight} kg`} />
                <KpiCard title="Último Peso" value={`${kpis.lastWeight} kg`} />
                <KpiCard title="Sesiones Totales" value={kpis.totalSessions} />
                <KpiCard title="Progreso Total" value={`${progressPercentage.toFixed(1)}%`} isPercentage={true} />
            </div>

            {/* Tabla de Historial */}
            <h2 className="text-lg font-semibold mb-4">Historial de Registros</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-96 overflow-y-auto">
    <div className="space-y-2">
        {history.map(log => (
            <div key={log.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4 bg-slate-800/50 p-4 rounded-lg text-sm">
                <div className="flex justify-between sm:justify-start items-center gap-4">
                  <span className="font-semibold text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span>
                  <span className="font-black text-lg text-emerald-400">{log.weight_kg} kg</span>
                </div>
                <div className="flex justify-between sm:justify-end items-center gap-4 border-t border-slate-700/50 sm:border-none pt-2 sm:pt-0">
                  <span className="text-slate-400">{log.sets_reps}</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-xs ${log.rir <= 1 ? 'bg-amber-500/10 text-amber-400' : 'bg-teal-500/10 text-teal-300'}`}>
                    RIR {log.rir}
                  </span>
                </div>
            </div>
        ))}
    </div>
</div>
          </div>
        )
      )}
    </div>
  );
};

// Componente pequeño para las tarjetas de KPI
const KpiCard = ({ title, value, isPercentage = false }: { title: string; value: string | number; isPercentage?: boolean }) => {
    const valueColor = isPercentage ? (parseFloat(value.toString()) > 0 ? 'text-green-400' : 'text-red-400') : 'text-emerald-400';

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center">
            <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
            <p className={`text-2xl font-black mt-1 ${valueColor}`}>{value}</p>
        </div>
    )
}

export default KpiDashboard;
