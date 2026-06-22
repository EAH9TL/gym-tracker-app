// src/components/ExerciseFilter.tsx
import React from 'react';

// Definimos las props que el componente necesita para funcionar
interface ExerciseFilterProps {
  filterText: string;
  setFilterText: (text: string) => void;
  filterSection: 'All' | 'Superior' | 'Inferior';
  setFilterSection: (section: 'All' | 'Superior' | 'Inferior') => void;
  itemCount?: number; // Opcional: para mostrar el número de resultados
}

const ExerciseFilter: React.FC<ExerciseFilterProps> = ({
  filterText,
  setFilterText,
  filterSection,
  setFilterSection,
  itemCount,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-300">Filtrar Ejercicios</h3>
        {/* Mostramos el contador de resultados si se proporciona */}
        {itemCount !== undefined && (
          <p className="text-xs text-slate-500">{itemCount} encontrados</p>
        )}
      </div>
      
      {/* Filtro de Texto */}
      <div>
        <input
          type="search"
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
            className={`py-2 rounded-lg font-semibold text-xs border transition-colors ${
              filterSection === sec 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' 
                : 'border-slate-700 hover:bg-slate-700/50'
            }`}
          >
            {sec === 'All' ? 'Todos' : sec}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExerciseFilter;
