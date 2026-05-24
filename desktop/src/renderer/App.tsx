import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Licenses from './pages/Licenses';
import ActivationCodes from './pages/ActivationCodes';
import Accounts from './pages/Accounts';
import Sessions from './pages/Sessions';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/codes" element={<ActivationCodes />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </ErrorBoundary>
  );
}
