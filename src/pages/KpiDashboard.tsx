// src/pages/KpiDashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Exercise, WorkoutLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ExerciseFilter from '../components/ExerciseFilter';
import Swal from 'sweetalert2';

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
  // Modal para editar un registro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [modalWeight, setModalWeight] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  // Modal handlers
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
    setModalWeight('');
    setIsSavingEdit(false);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingLog) return;
    const parsed = parseFloat(modalWeight);
    if (Number.isNaN(parsed)) {
      Swal.fire({ title: 'Valor inválido', text: 'Introduce un número válido', icon: 'error', background: '#1e293b', color: '#e2e8f0' });
      return;
    }
    setIsSavingEdit(true);
    const { error } = await supabase.from('workout_logs').update({ weight_kg: parsed }).eq('id', editingLog.id);
    setIsSavingEdit(false);
    if (error) {
      Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1e293b', color: '#e2e8f0' });
    } else {
      setHistory(prev => prev.map(h => h.id === editingLog.id ? { ...h, weight_kg: parsed } : h));
      Swal.fire({ title: 'Actualizado', icon: 'success', timer: 1100, showConfirmButton: false, background: '#1e293b', color: '#e2e8f0' });
      closeModal();
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-200">
        KPIs y Progreso
      </h1>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-8 space-y-4">
                <ExerciseFilter
                    filterText={filterText}
                    setFilterText={setFilterText}
                    filterSection={filterSection}
                    setFilterSection={setFilterSection}
                />
                 <div>
                    <select 
                      value={selectedExId} 
                      onChange={e => setSelectedExId(e.target.value)} 
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
                    >
                        <option value="">-- Selecciona de la lista ({filteredExercises.length}) --</option>
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
                              <div>
                                <span className="font-semibold text-slate-400 text-sm block">{new Date(log.created_at).toLocaleDateString()}</span>
                                <span className="font-black text-lg text-slate-200">{log.weight_kg} kg</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => {
                                    setEditingLog(log);
                                    setModalWeight(String(log.weight_kg));
                                    setIsModalOpen(true);
                                }} className="text-slate-300 bg-slate-800/30 hover:bg-slate-700 px-3 py-1 rounded-md text-sm">Editar</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
            </div>
          </div>
        )
      )}
      {/* Modal Tailwind para editar registro */}
      {isModalOpen && (
        <div 
            onClick={closeModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">✏️ Editar Registro</h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-300">Fecha</label>
                <input type="text" value={editingLog ? new Date(editingLog.created_at).toLocaleString() : ''} disabled className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-400"/>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-300">Peso (kg)</label>
                <input type="number" inputMode='decimal' step="0.5" value={modalWeight} onChange={e => setModalWeight(e.target.value)} placeholder="Introduce el peso" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5"/>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isSavingEdit} className="flex-1 rounded-lg bg-emerald-500 py-2 font-bold text-slate-950">{isSavingEdit ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg bg-slate-800 py-2 font-semibold text-slate-300 border border-slate-700">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
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
