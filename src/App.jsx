import { Routes, Route, Navigate } from 'react-router-dom';
import IssuePage from './pages/IssuePage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IssuePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
