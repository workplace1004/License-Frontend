import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import IssuePage from './pages/IssuePage.jsx';
import AdminLayout from './pages/AdminLayout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminSettings from './pages/AdminSettings.jsx';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        containerStyle={{ top: 16, right: 16 }}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#34495e',
            color: '#ecf0f1',
            border: '1px solid #4a6278',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)'
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#2c3e50' },
            style: { border: '1px solid rgba(34, 197, 94, 0.45)' }
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#2c3e50' },
            style: { border: '1px solid rgba(248, 113, 113, 0.45)' }
          }
        }}
      />
      <Routes>
      <Route path="/" element={<IssuePage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
