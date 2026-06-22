// src/App.tsx
import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import WorkoutLogger from './pages/WorkoutLogger';
import KpiDashboard from './pages/KpiDashboard';
import ExerciseManager from './pages/ExerciseManager';

function App() {
  return (
    <Routes>
      {/* Todas las rutas están dentro de Layout para tener la barra de navegación */}
      <Route path="/" element={<Layout />}>
        {/* La página por defecto será el registro de entrenamientos */}
        <Route index element={<WorkoutLogger />} />
        <Route path="kpis" element={<KpiDashboard />} />
        <Route path="exercises" element={<ExerciseManager />} />
      </Route>
    </Routes>
  );
}

export default App;
