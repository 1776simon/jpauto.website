import { Route, Router } from '@solidjs/router';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function AppContent() {
  return (
    <>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={ProtectedDashboard} />
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
