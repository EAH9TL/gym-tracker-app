// src/pages/KpiDashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, WorkoutLog, Difficulty } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import EditLogModal from '../components/EditLogModal';

// --- Componente para el Gráfico de Progreso ---
const ProgressChart = ({ data }: { data: WorkoutLog[] }) => {
  const chartData = useMemo(() => {
    return data
      .map((log) => ({
        date: new Date(log.created_at).toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric',
        }),
        peso: log.weight_kg,
      }))
      .reverse();
  }, [data]);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#f1f5f9',
            }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="#10b981"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            name="Peso (kg)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Componente para las Tarjetas de KPI ---
const KpiCard = ({
  title,
  value,
  isPercentage = false,
  color = 'text-emerald-400',
}: {
  title: string;
  value: string | number;
  isPercentage?: boolean;
  color?: string;
}) => {
  const valueColor = isPercentage
    ? parseFloat(value.toString()) > 0
      ? 'text-green-400'
      : 'text-red-400'
    : color;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
      <p className="text-xs font-bold text-slate-500 uppercase">{title}</p>
      <p className={`mt-1 text-2xl font-black ${valueColor}`}>{value}</p>
    </div>
  );
};

// --- Componente Principal de la Página ---
const KpiDashboard = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterSection, setFilterSection] = useState<
    'All' | 'Superior' | 'Inferior'
  >('All');

  const difficultyStyles: Record<Difficulty, string> = {
    Fácil: 'bg-green-500/10 text-green-400',
    Medio: 'bg-yellow-500/10 text-yellow-400',
    Difícil: 'bg-red-500/10 text-red-400',
  };

  const fetchExercises = async () => {
    setLoading(true);
    const { data } = await supabase.from('exercises').select('*').order('name');
    if (data) setExercises(data);
    setLoading(false);
  };

  const fetchHistory = async () => {
    if (!selectedExId) return;
    setLoading(true);
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('exercise_id', selectedExId)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExercises();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExId]);

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

  useEffect(() => {
    if (
      selectedExId &&
      !filteredExercises.some((ex) => ex.id.toString() === selectedExId)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedExId('');
    }
  }, [filteredExercises, selectedExId]);

  const kpis = useMemo(() => {
    if (history.length === 0)
      return { maxWeight: 0, lastWeight: 0, totalSessions: 0, firstWeight: 0 };
    const weights = history.map((log) => log.weight_kg);
    const maxWeight = Math.max(...weights);
    const lastWeight = history[0].weight_kg;
    const firstWeight = history[history.length - 1].weight_kg;
    return {
      maxWeight,
      lastWeight,
      totalSessions: history.length,
      firstWeight,
    };
  }, [history]);

  const progressPercentage = useMemo(() => {
    if (kpis.firstWeight === 0 || kpis.lastWeight <= kpis.firstWeight) return 0;
    return ((kpis.lastWeight - kpis.firstWeight) / kpis.firstWeight) * 100;
  }, [kpis]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-200 sm:text-3xl">
        KPIs y Progreso
      </h1>

      <div className="mb-8 space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="font-bold text-slate-300">Analizar Ejercicio</h3>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm"
        />
        <div className="grid grid-cols-3 gap-2">
          {(['All', 'Superior', 'Inferior'] as const).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setFilterSection(sec)}
              className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${filterSection === sec ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:bg-slate-700/50'}`}
            >
              {sec === 'All' ? 'Todos' : sec}
            </button>
          ))}
        </div>
        <select
          value={selectedExId}
          onChange={(e) => setSelectedExId(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"
        >
          <option value="">
            -- Selecciona de la lista ({filteredExercises.length}) --
          </option>
          {filteredExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {loading && selectedExId && (
        <p className="py-8 text-center text-slate-400">Cargando datos...</p>
      )}
      {!selectedExId && (
        <p className="mt-10 text-center text-slate-500">
          Elige un ejercicio para comenzar el análisis.
        </p>
      )}

      {selectedExId &&
        !loading &&
        (history.length === 0 ? (
          <p className="mt-10 text-center text-slate-500">
            No hay registros para este ejercicio todavía.
          </p>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <KpiCard
                title="Primer Peso"
                value={`${kpis.firstWeight} kg`}
                color="text-sky-400"
              />
              <KpiCard
                title="Último Peso"
                value={`${kpis.lastWeight} kg`}
                color="text-amber-400"
              />
              <KpiCard
                title="Récord Máximo"
                value={`${kpis.maxWeight} kg`}
                color="text-emerald-400"
              />
              <KpiCard
                title="Progreso Total"
                value={`${progressPercentage.toFixed(1)}%`}
                isPercentage={true}
              />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="mb-4 text-lg font-semibold text-slate-200">
                Evolución del Peso
              </h2>
              <ProgressChart data={history} />
            </div>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">
                  Historial de Registros
                </h2>
                <p className="rounded-md bg-slate-800/50 px-2 py-1 text-xs font-bold text-slate-500">
                  Sesiones:{' '}
                  <span className="text-teal-400">{kpis.totalSessions}</span>
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-2">
                <div className="space-y-1">
                  {history.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center rounded-lg bg-slate-800/40 p-3 hover:bg-slate-800/60"
                    >
                      <span className="flex-1 text-sm font-semibold text-slate-400">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex-1 text-center text-lg font-black text-slate-200">
                        {log.weight_kg} kg
                      </span>
                      <div className="flex flex-1 justify-center">
                        {log.difficulty && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyStyles[log.difficulty]}`}
                          >
                            {log.difficulty}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 justify-end">
                        <button
                          onClick={() => setEditingLog(log)}
                          className="rounded-md bg-slate-800/30 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

      {editingLog && (
        <EditLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSave={() => {
            fetchHistory();
            setEditingLog(null);
          }}
        />
      )}
    </div>
  );
};

export default KpiDashboard;
