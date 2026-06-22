// src/App.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Exercise, ExerciseInsert, WorkoutLogInsert, WorkoutLog, Profile } from './types';
import Auth from './Auth';
import './index.css';
import type { Session } from '@supabase/supabase-js';

function App() {
  // --- Estados de Sesión y Autenticación ---
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // --- Estados de Datos del Catálogo ---
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // --- Estados para Crear/Editar Ejercicio (ADMIN ONLY) ---
  const [newExName, setNewExName] = useState<string>('');
  const [newExSection, setNewExSection] = useState<'Superior' | 'Inferior'>('Superior');
  const [newExNotes, setNewExNotes] = useState<string>('');
  const [editingExId, setEditingExId] = useState<number | null>(null);
  const [creatingExercise, setCreatingExercise] = useState<boolean>(false);

  // --- Estados para Registrar Marca (USER LOG) ---
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [setsReps, setSetsReps] = useState<string>('');
  const [rir, setRir] = useState<string>('');
  const [savingLog, setSavingLog] = useState<boolean>(false);

  // --- Estados para Historial e Indicadores KPIs ---
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [filterSection, setFilterSection] = useState<'Todos' | 'Superior' | 'Inferior'>('Todos');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

    // --- Mostrar alertas temporales ---
  const showFeedback = (text: string, isError = false) => {
    setFeedbackMessage({ text, isError });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

    // Obtener rol del perfil
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) setProfile(data);
  };

    // --- Consultas a la Base de Datos ---
  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) showFeedback('Error al cargar ejercicios: ' + error.message, true);
    else if (data) setExercises(data);
  };

    const fetchExerciseHistory = async (exerciseId: number) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false }); // El más reciente primero

    if (error) showFeedback('Error al cargar historial: ' + error.message, true);
    else if (data) setHistory(data);
    setLoadingHistory(false);
  };

  // --- 1. Control de Escucha de Sesión de Usuario ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar ejercicios al iniciar
  useEffect(() => {
    if (session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchExercises();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Cargar historial cuando seleccionamos un ejercicio específico
  useEffect(() => {
    if (selectedExId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchExerciseHistory(parseInt(selectedExId, 10));
    } else {
      setHistory([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExId]);

  // --- Mutación: Crear o Editar Ejercicio (Admin Only) ---
  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.is_admin) {
      showFeedback('No tienes permisos de Administrador.', true);
      return;
    }
    if (!newExName.trim()) {
      showFeedback('El nombre es obligatorio.', true);
      return;
    }

    setCreatingExercise(true);
    const payload: ExerciseInsert = {
      name: newExName.trim(),
      body_section: newExSection,
      notes: newExNotes.trim() || undefined,
    };

    let error;
    if (editingExId) {
      // Acción de EDITAR
      const { error: err } = await supabase
        .from('exercises')
        .update(payload)
        .eq('id', editingExId);
      error = err;
    } else {
      // Acción de CREAR
      const { error: err } = await supabase.from('exercises').insert([payload]);
      error = err;
    }

    setCreatingExercise(false);

    if (error) {
      showFeedback('Error al guardar ejercicio: ' + error.message, true);
    } else {
      showFeedback(editingExId ? '¡Ejercicio editado con éxito!' : '¡Ejercicio creado con éxito!');
      setNewExName('');
      setNewExNotes('');
      setEditingExId(null);
      fetchExercises();
    }
  };

  // --- Mutación: Guardar Marca de Entrenamiento (User Only) ---
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExId || !weight || !setsReps || rir === '') {
      showFeedback('Completa todos los datos.', true);
      return;
    }

    setSavingLog(true);
    const log: WorkoutLogInsert = {
      exercise_id: parseInt(selectedExId, 10),
      weight_kg: parseFloat(weight),
      sets_reps: setsReps.trim(),
      rir: parseInt(rir, 10),
    };

    const { error } = await supabase.from('workout_logs').insert([log]);
    setSavingLog(false);

    if (error) {
      showFeedback('Error al guardar: ' + error.message, true);
    } else {
      showFeedback('¡Marca registrada con éxito!');
      setWeight('');
      setSetsReps('');
      setRir('');
      fetchExerciseHistory(parseInt(selectedExId, 10)); // Recarga los KPIs
    }
  };

  // --- CÁLCULO DE KPIs ---
  const getKPIs = () => {
    if (history.length === 0) return { maxWeight: 0, lastWeight: 0, totalLogs: 0 };
    
    // Obtener el peso máximo de todo el histórico
    const weights = history.map(h => h.weight_kg);
    const maxWeight = Math.max(...weights);
    
    // El último peso registrado (el primero del array por el order de la query)
    const lastWeight = history[0].weight_kg;

    return {
      maxWeight,
      lastWeight,
      totalLogs: history.length
    };
  };

  const kpis = getKPIs();

  // --- Si el usuario no está logueado, mostrar Login ---
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center">
      
      {/* HEADER CON BOTÓN CERRAR SESIÓN */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-10 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            Gym Tracker Pro 🏋️‍♂️
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sesión iniciada como: <span className="text-emerald-400 font-semibold">{session.user.email}</span> 
            {profile?.is_admin && <span className="ml-2 bg-purple-500/15 text-purple-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-purple-500/20">Admin</span>}
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-lg border border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 px-4 py-2 text-xs font-semibold transition"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* ALERTAS */}
      {feedbackMessage && (
        <div className={`fixed top-5 z-50 rounded-lg p-4 shadow-2xl border transition ${
          feedbackMessage.isError ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          <p className="text-sm font-semibold">{feedbackMessage.text}</p>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL */}
      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUMNA 1: GESTIÓN DE EJERCICIOS (ADMIN ONLY O SOLO LECTURA SI ES USUARIO NORMAL) */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200">
              1. Catálogo de Ejercicios
            </h2>
            {profile?.is_admin && editingExId && (
              <button 
                onClick={() => { setEditingExId(null); setNewExName(''); setNewExNotes(''); }}
                className="text-xs text-rose-400 underline hover:text-rose-300"
              >
                Cancelar Edición
              </button>
            )}
          </div>

          {profile?.is_admin ? (
            <form onSubmit={handleSaveExercise} className="space-y-4 mb-8 p-4 rounded-xl bg-slate-850 border border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {editingExId ? '✏️ Editar Ejercicio' : '➕ Crear Ejercicio'}
              </h3>
              <div>
                <input
                  type="text"
                  placeholder="Nombre del Ejercicio"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewExSection('Superior')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${newExSection === 'Superior' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'border-slate-700 bg-slate-800/40'}`}
                >
                  Superior
                </button>
                <button
                  type="button"
                  onClick={() => setNewExSection('Inferior')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${newExSection === 'Inferior' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'border-slate-700 bg-slate-800/40'}`}
                >
                  Inferior
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Notas adicionales (opcional)"
                  value={newExNotes}
                  onChange={(e) => setNewExNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={creatingExercise}
                className="w-full rounded-lg bg-emerald-500 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                {editingExId ? 'Guardar Cambios' : 'Insertar Ejercicio'}
              </button>
            </form>
          ) : (
            <div className="mb-6 p-3 rounded-lg bg-slate-850 border border-slate-800 text-center text-xs text-slate-400">
              ℹ️ Solo el administrador puede crear o editar ejercicios.
            </div>
          )}

          {/* LISTA RÁPIDA DE EJERCICIOS PARA EDITAR (ADMIN) */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ejercicios Existentes</h4>
            {exercises.map((ex) => (
              <div key={ex.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{ex.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{ex.body_section} {ex.notes ? `• ${ex.notes}` : ''}</p>
                </div>
                {profile?.is_admin && (
                  <button
                    onClick={() => {
                      setEditingExId(ex.id);
                      setNewExName(ex.name);
                      setNewExSection(ex.body_section);
                      setNewExNotes(ex.notes || '');
                    }}
                    className="text-xs text-teal-400 font-bold hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* COLUMNA 2: REGISTRAR ENTRENAMIENTO Y VER KPIs */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold text-slate-200 mb-6">
            2. Registrar Serie y KPIs
          </h2>

          <form onSubmit={handleSaveLog} className="space-y-4 mb-8">
            <div className="flex gap-2 bg-slate-850 p-1 rounded-lg border border-slate-800">
              {(['Todos', 'Superior', 'Inferior'] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setFilterSection(sec)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-bold transition ${filterSection === sec ? 'bg-slate-800 text-teal-400' : 'text-slate-400'}`}
                >
                  {sec}
                </button>
              ))}
            </div>

            <div>
              <select
                value={selectedExId}
                onChange={(e) => setSelectedExId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none"
              >
                <option value="">-- Elige un ejercicio del catálogo --</option>
                {exercises
                  .filter(ex => filterSection === 'Todos' || ex.body_section === filterSection)
                  .map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))
                }
              </select>
            </div>

            {selectedExId && (
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Peso kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="3x10"
                  value={setsReps}
                  onChange={(e) => setSetsReps(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="RIR"
                  value={rir}
                  onChange={(e) => setRir(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            )}

            {selectedExId && (
              <button
                type="submit"
                disabled={savingLog}
                className="w-full rounded-lg bg-teal-500 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-teal-400"
              >
                {savingLog ? 'Guardando...' : 'Registrar Marca'}
              </button>
            )}
          </form>

          {/* KPIs Y HISTORIAL POR EJERCICIO SELECCIONADO */}
          {selectedExId ? (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                📊 KPIs del Ejercicio
              </h3>
              
              {loadingHistory ? (
                <div className="text-center text-xs text-slate-400 py-6">Calculando métricas...</div>
              ) : history.length > 0 ? (
                <div>
                  {/* Tarjetas KPI */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-850 p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Máximo Histórico</p>
                      <p className="text-lg font-black text-emerald-400 mt-1">{kpis.maxWeight} kg</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-850 p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Último Peso</p>
                      <p className="text-lg font-black text-slate-200 mt-1">{kpis.lastWeight} kg</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-850 p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Sesiones</p>
                      <p className="text-lg font-black text-teal-400 mt-1">{kpis.totalLogs}</p>
                    </div>
                  </div>

                  {/* Tabla Histórica */}
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Historial Reciente</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {history.map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-800 bg-slate-850/30 text-xs">
                        <span className="text-slate-400">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-extrabold text-slate-200">
                          {log.weight_kg} kg <span className="text-slate-500 font-normal">({log.sets_reps})</span>
                        </span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${log.rir <= 1 ? 'bg-amber-500/10 text-amber-400' : 'bg-teal-500/10 text-teal-300'}`}>
                          RIR {log.rir}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500 py-6">
                  Todavía no has registrado entrenamientos de este ejercicio.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 py-10">
              Selecciona un ejercicio para ver tus estadísticas y progresos.
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;
