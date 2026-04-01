import { Routes, Route, Navigate } from 'react-router-dom';
import IssuePage from './pages/IssuePage.jsx';
import AdminLayout from './pages/AdminLayout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminSettings from './pages/AdminSettings.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IssuePage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
