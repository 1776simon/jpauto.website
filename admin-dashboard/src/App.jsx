import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';
import './App.css';

// Login Page Component
function LoginPage() {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JP Auto</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-300 font-medium"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Admin access only. Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Dashboard Layout Component
function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          <h1 className={`text-xl font-bold text-primary ${!sidebarOpen && 'hidden'}`}>JP Auto Admin</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mt-4 text-gray-500 hover:text-gray-700"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="mt-6">
          <NavLink to="/dashboard" icon="📊" label="Dashboard" collapsed={!sidebarOpen} />
          <NavLink to="/dashboard/submissions" icon="📝" label="Submissions" collapsed={!sidebarOpen} />
          <NavLink to="/dashboard/inventory" icon="🚗" label="Inventory" collapsed={!sidebarOpen} />
          <NavLink to="/dashboard/exports" icon="📤" label="Exports" collapsed={!sidebarOpen} />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// Navigation Link Component
function NavLink({ to, icon, label, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-6 py-3 transition-colors ${
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-700 hover:bg-gray-100'
      } ${collapsed && 'justify-center'}`}
    >
      <span className="text-xl">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
}

// Dashboard Home Page
function DashboardHome() {
  const [stats, setStats] = useState({ pending: 0, inventory: 0, featured: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [submissions, inventoryStats] = await Promise.all([
        api.getSubmissions('pending'),
        api.getInventoryStats().catch(() => ({ total: 0, featured: 0 }))
      ]);

      setStats({
        pending: submissions.submissions?.length || 0,
        inventory: inventoryStats.total || 0,
        featured: inventoryStats.featured || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Pending Submissions"
          value={stats.pending}
          icon="📝"
          color="orange"
        />
        <StatCard
          title="Total Inventory"
          value={stats.inventory}
          icon="🚗"
          color="blue"
        />
        <StatCard
          title="Featured Vehicles"
          value={stats.featured}
          icon="⭐"
          color="yellow"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/dashboard/submissions"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Review Submissions</h3>
            <p className="text-sm text-gray-600 mt-1">Approve or reject pending vehicles</p>
          </Link>
          <Link
            to="/dashboard/exports"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Export Data</h3>
            <p className="text-sm text-gray-600 mt-1">Download inventory for website</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Submissions Page
function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await api.getSubmissions(filter);
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Approve this submission and add to inventory?')) return;

    try {
      await api.approveSubmission(id);
      alert('Submission approved successfully!');
      loadSubmissions();
    } catch (error) {
      alert('Failed to approve submission: ' + error.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      await api.rejectSubmission(id, reason);
      alert('Submission rejected.');
      loadSubmissions();
    } catch (error) {
      alert('Failed to reject submission: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Submissions</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Submission Card Component
function SubmissionCard({ submission, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">
              {submission.year} {submission.make} {submission.model}
            </h3>
            <p className="text-gray-600 mt-1">VIN: {submission.vin}</p>
            <p className="text-sm text-gray-500 mt-1">
              Submitted {new Date(submission.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              submission.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : submission.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {submission.status}
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-primary hover:text-primary-dark font-medium"
        >
          {expanded ? 'Hide Details ↑' : 'Show Details ↓'}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Mileage</p>
                <p className="font-medium">{submission.mileage?.toLocaleString()} miles</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-medium">${submission.price?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Condition</p>
                <p className="font-medium capitalize">{submission.condition}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Color</p>
                <p className="font-medium">{submission.color}</p>
              </div>
            </div>

            {submission.description && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Description</p>
                <p className="mt-1">{submission.description}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Contact Information</p>
              <p className="text-sm"><strong>Name:</strong> {submission.seller_name}</p>
              <p className="text-sm"><strong>Email:</strong> {submission.seller_email}</p>
              <p className="text-sm"><strong>Phone:</strong> {submission.seller_phone}</p>
            </div>

            {submission.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(submission.id)}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => onReject(submission.id)}
                  className="flex-1 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Inventory Page
function InventoryPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Inventory</h1>

      {loading ? (
        <LoadingSpinner />
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No vehicles in inventory</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}

// Vehicle Card Component
function VehicleCard({ vehicle }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {vehicle.images?.[0] && (
        <img
          src={vehicle.images[0]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        {vehicle.trim && (
          <p className="text-sm text-gray-600">{vehicle.trim}</p>
        )}
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xl font-bold text-primary">
            ${vehicle.price?.toLocaleString()}
          </span>
          <span className="text-sm text-gray-600">
            {vehicle.mileage?.toLocaleString()} mi
          </span>
        </div>
        {vehicle.featured && (
          <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
            ⭐ Featured
          </span>
        )}
      </div>
    </div>
  );
}

// Exports Page
function ExportsPage() {
  const [exporting, setExporting] = useState(false);

  const handleJekyllExport = async () => {
    try {
      setExporting(true);
      await api.exportToJekyll();
      alert('Jekyll export downloaded successfully!');
    } catch (error) {
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Exports</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export to Jekyll Website</h2>
        <p className="text-gray-600 mb-6">
          Download all approved vehicles as Jekyll data files and images for your static website.
        </p>

        <button
          onClick={handleJekyllExport}
          disabled={exporting}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? 'Exporting...' : '📤 Download Jekyll Export'}
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">What's included:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Vehicle data in YAML format (_data/vehicles.yml)</li>
            <li>Optimized vehicle images</li>
            <li>Thumbnails for faster page loading</li>
            <li>Ready to drop into your Jekyll _data and assets folders</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Utility Components
function StatCard({ title, value, icon, color }) {
  const colors = {
    orange: 'bg-orange-100 text-orange-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardHome />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/submissions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SubmissionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/inventory"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InventoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/exports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ExportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
