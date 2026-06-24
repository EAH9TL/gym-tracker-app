// src/components/EditLogModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { WorkoutLog, Difficulty } from '../types';
import Swal from 'sweetalert2';

// Definimos las props que el modal necesita para funcionar
interface EditLogModalProps {
  log: WorkoutLog | null; // El registro específico que se va a editar
  onClose: () => void;    // Función para cerrar el modal desde el padre
  onSave: () => void;     // Función para que el padre refresque los datos
}

const EditLogModal: React.FC<EditLogModalProps> = ({ log, onClose, onSave }) => {
  // Estados internos para los campos del formulario
  const [weight, setWeight] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Este efecto se ejecuta cuando la prop 'log' cambia.
  // Llena el formulario con los datos del registro que se está editando.
  useEffect(() => {
    if (log) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWeight(log.weight_kg.toString());
      setDifficulty(log.difficulty || null);
    }
  }, [log]);

  // Si no se ha pasado ningún log para editar, no se renderiza nada.
  if (!log) {
    return null;
  }

  // Función para guardar los cambios en la base de datos
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !difficulty) {
        Swal.fire({ title: 'Campos incompletos', text: 'El peso y la dificultad son obligatorios.', icon: 'warning', background: '#1e293b', color: '#e2e8f0' });
        return;
    }
    setIsSaving(true);

    const { error } = await supabase
      .from('workout_logs')
      .update({
        weight_kg: parseFloat(weight),
        difficulty: difficulty,
      })
      .eq('id', log.id); // Condición WHERE para actualizar solo el registro correcto
    
    setIsSaving(false);

    if (error) {
      Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1e293b', color: '#e2e8f0' });
    } else {
      Swal.fire({ title: '¡Actualizado!', text: 'El registro ha sido modificado.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#e2e8f0' });
      onSave(); // Llama a la función onSave para que KpiDashboard refresque su lista
      onClose(); // Cierra el modal
    }
  };

  const difficultyStyles: Record<Difficulty, string> = {
    Fácil: 'bg-green-500/10 text-green-400 border-green-500/30',
    Medio: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Difícil: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    // Overlay del modal
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Contenido del modal */}
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">✏️ Editar Registro</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-300">Peso (kg)</label>
            <input type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-center text-lg font-bold"/>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">Dificultad</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Fácil', 'Medio', 'Difícil'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2.5 rounded-lg font-semibold text-sm border transition-all ${difficulty === d ? `${difficultyStyles[d]} scale-105` : 'border-slate-700 hover:bg-slate-800/50'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditLogModal;
