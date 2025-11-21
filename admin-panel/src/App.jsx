import { Route, Router } from '@solidjs/router';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Submissions from './pages/Submissions';
import Inventory from './pages/Inventory';
import Exports from './pages/Exports';

function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function ProtectedSubmissions() {
  return (
    <ProtectedRoute>
      <Submissions />
    </ProtectedRoute>
  );
}

function ProtectedInventory() {
  return (
    <ProtectedRoute>
      <Inventory />
    </ProtectedRoute>
  );
}

function ProtectedExports() {
  return (
    <ProtectedRoute>
      <Exports />
    </ProtectedRoute>
  );
}

function AppContent() {
  return (
    <>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/submissions" component={ProtectedSubmissions} />
      <Route path="/inventory" component={ProtectedInventory} />
      <Route path="/exports" component={ProtectedExports} />
      <Route path="/" component={ProtectedDashboard} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
