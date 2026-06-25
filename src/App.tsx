// src/App.tsx
import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import WorkoutLogger from './pages/WorkoutLogger';
import KpiDashboard from './pages/KpiDashboard';
import ExerciseManager from './pages/ExerciseManager';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<WorkoutLogger />} />
        <Route path="kpis" element={<KpiDashboard />} />
        <Route path="exercises" element={<ExerciseManager />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
