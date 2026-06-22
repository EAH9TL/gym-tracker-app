// src/pages/KpiDashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, WorkoutLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Componente ProgressChart (sin cambios)
const ProgressChart = ({ data }: { data: WorkoutLog[] }) => {
  const chartData = useMemo(() => {
    return data.map(log => ({
        date: new Date(log.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        peso: log.weight_kg,
    })).reverse();
  }, [data]);
  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']}/>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f1f5f9' }} labelStyle={{ color: '#9ca3af' }} />
                <Legend wrapperStyle={{ fontSize: '14px' }}/>
                <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} name="Peso (kg)" />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};


const KpiDashboard = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NUEVOS ESTADOS PARA LOS FILTROS ---
  const [filterText, setFilterText] = useState('');
  const [filterSection, setFilterSection] = useState<'All' | 'Superior' | 'Inferior'>('All');

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase.from('exercises').select('*').order('name');
      if (data) setExercises(data);
      setLoading(false);
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    if (selectedExId) {
      //... (lógica de fetching de historial sin cambios)
      const fetchHistory = async () => {
        setLoading(true);
        const { data } = await supabase.from('workout_logs').select('*').eq('exercise_id', selectedExId).order('created_at', { ascending: false });
        if (data) setHistory(data);
        setLoading(false);
      };
      fetchHistory();
    } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory([]);
    }
  }, [selectedExId]);
  
  // --- LÓGICA DE FILTRADO ---
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const sectionMatch = filterSection === 'All' || ex.body_section === filterSection;
      const textMatch = ex.name.toLowerCase().includes(filterText.toLowerCase());
      return sectionMatch && textMatch;
    });
  }, [exercises, filterText, filterSection]);

  // Lógica para deseleccionar el ejercicio si desaparece de la lista filtrada
  useEffect(() => {
    if (selectedExId && !filteredExercises.some(ex => ex.id.toString() === selectedExId)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedExId('');
    }
  }, [filteredExercises, selectedExId]);

  // Lógica de KPIs (sin cambios)
  const kpis = useMemo(() => {
    // ...
    if (history.length === 0) return { maxWeight: 0, lastWeight: 0, totalSessions: 0, firstWeight: 0 };
    const weights = history.map(log => log.weight_kg);
    const maxWeight = Math.max(...weights);
    const lastWeight = history[0].weight_kg;
    const firstWeight = history[history.length - 1].weight_kg;
    return { maxWeight, lastWeight, totalSessions: history.length, firstWeight };
  }, [history]);
  const progressPercentage = useMemo(() => {
    // ...
    if (kpis.firstWeight === 0 || kpis.lastWeight <= kpis.firstWeight) return 0;
    return ((kpis.lastWeight - kpis.firstWeight) / kpis.firstWeight) * 100;
  }, [kpis]);


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-200">
        KPIs y Progreso
      </h1>

      {/* --- SECCIÓN DE FILTROS Y SELECTOR --- */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-8 space-y-4">
        <h3 className="font-bold text-slate-300">Analizar Ejercicio</h3>
        {/* Filtro de Texto */}
        <div>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
        {/* Filtro de Sección */}
        <div className="grid grid-cols-3 gap-2">
            {(['All', 'Superior', 'Inferior'] as const).map(sec => (
                <button
                    key={sec}
                    type="button"
                    onClick={() => setFilterSection(sec)}
                    className={`py-2 rounded-lg font-semibold text-xs border transition-colors ${filterSection === sec ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'border-slate-700 hover:bg-slate-700/50'}`}
                >
                    {sec === 'All' ? 'Todos' : sec}
                </button>
            ))}
        </div>
        {/* Selector de Ejercicio */}
        <div>
            <select 
              value={selectedExId} 
              onChange={e => setSelectedExId(e.target.value)} 
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
            >
                <option value="">-- Selecciona de la lista ({filteredExercises.length}) --</option>
                {/* AHORA MAPEAMOS SOBRE LA LISTA FILTRADA */}
                {filteredExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
        </div>
      </div>

      {/* El resto del dashboard (KPIs, Gráfico, Historial) sin cambios */}
      {loading && selectedExId && <p className="text-center text-slate-400 py-8">Cargando datos...</p>}
      {!selectedExId && <p className="text-center text-slate-500 mt-10">Elige un ejercicio para comenzar el análisis.</p>}
      {selectedExId && !loading && (
        // ... (el JSX para mostrar los KPIs, gráfico e historial)
        history.length === 0 ? (
            <p className="text-center text-slate-500 mt-10">No hay registros para este ejercicio todavía.</p>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Primer Peso" value={`${kpis.firstWeight} kg`} color="text-sky-400"/>
                <KpiCard title="Último Peso" value={`${kpis.lastWeight} kg`} color="text-amber-400"/>
                <KpiCard title="Récord Máximo" value={`${kpis.maxWeight} kg`} color="text-emerald-400"/>
                <KpiCard title="Progreso Total" value={`${progressPercentage.toFixed(1)}%`} isPercentage={true} />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <h2 className="text-lg font-semibold mb-4 text-slate-200">Evolución del Peso</h2>
                <ProgressChart data={history} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-semibold text-slate-200">Historial de Registros</h2>
                 <p className="text-xs font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">Sesiones: <span className="text-teal-400">{kpis.totalSessions}</span></p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-60 overflow-y-auto">
                  <div className="space-y-1">
                      {history.map(log => (
                          <div key={log.id} className="flex justify-between items-center bg-slate-800/40 p-3.5 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                              <span className="font-semibold text-slate-400 text-sm">{new Date(log.created_at).toLocaleDateString()}</span>
                              <span className="font-black text-lg text-slate-200">{log.weight_kg} kg</span>
                          </div>
                      ))}
                  </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

// Componente KpiCard (sin cambios)
const KpiCard = ({ title, value, isPercentage = false, color = 'text-emerald-400' }: { title: string; value: string | number; isPercentage?: boolean; color?: string }) => {
    const valueColor = isPercentage ? (parseFloat(value.toString()) > 0 ? 'text-green-400' : 'text-red-400') : color;
    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
            <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
            <p className={`text-2xl font-black mt-1 ${valueColor}`}>{value}</p>
        </div>
    )
};

export default KpiDashboard;
