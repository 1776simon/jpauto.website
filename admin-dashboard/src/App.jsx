import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';

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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full card-elevated p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">JP Auto</h1>
          <p className="text-gray-600 text-base">Admin Dashboard</p>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 card-outlined px-6 py-4 hover:bg-primary/5 transition-all duration-200 font-medium"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
            <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
            <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l5.66-4.45 1.69-1.25z"/>
            <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
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
      {/* Sidebar / Navigation Rail */}
      <aside className={`fixed left-0 top-0 h-full nav-rail shadow-md transition-all duration-300 z-40 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <h1 className={`text-xl font-bold text-primary transition-opacity ${!sidebarOpen && 'opacity-0 w-0 overflow-hidden'}`}>
            JP Auto Admin
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        <nav className="mt-6 pb-24">
          <NavLink to="/dashboard" icon="📊" label="Dashboard" collapsed={!sidebarOpen} />
          <NavLink to="/dashboard/submissions" icon="📝" label="Submissions" collapsed={!sidebarOpen} />
          <NavLink to="/dashboard/inventory" icon="🚗" label="Inventory" collapsed={!sidebarOpen} />
          <NavLink to="/dashboard/exports" icon="📤" label="Exports" collapsed={!sidebarOpen} />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <button
                  onClick={logout}
                  className="text-xs text-gray-600 hover:text-primary transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="p-6 lg:p-8">
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
      className={`nav-item mb-2 ${
        isActive ? 'nav-item-active shadow-sm' : 'hover:shadow-sm'
      } ${collapsed && 'justify-center px-0 w-16 mx-auto'}`}
    >
      <span className="text-2xl">{icon}</span>
      {!collapsed && <span className="font-medium text-base">{label}</span>}
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
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

      <div className="card-elevated p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/dashboard/submissions"
            className="card-outlined p-6 hover:bg-primary/5 hover:border-primary transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
                📝
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-1">Review Submissions</h3>
                <p className="text-sm text-gray-600">Approve or reject pending vehicles</p>
              </div>
            </div>
          </Link>
          <Link
            to="/dashboard/exports"
            className="card-outlined p-6 hover:bg-primary/5 hover:border-primary transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
                📤
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-1">Export Data</h3>
                <p className="text-sm text-gray-600">Download inventory for website</p>
              </div>
            </div>
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
    if (reason === null) return;

    try {
      await api.rejectSubmission(id, reason);
      alert('Submission rejected.');
      loadSubmissions();
    } catch (error) {
      alert('Failed to reject submission: ' + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Submissions</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-outlined w-full sm:w-auto"
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
        <div className="card-elevated p-16 text-center">
          <p className="text-gray-500 text-lg">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-6">
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const status = submission.submissionStatus || submission.status;

  const images = (() => {
    try {
      if (typeof submission.images === 'string') {
        return JSON.parse(submission.images);
      }
      return submission.images || [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="card-elevated overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {submission.year} {submission.make} {submission.model}
            </h3>
            <p className="text-gray-600 font-medium">VIN: {submission.vin}</p>
            <p className="text-sm text-gray-500 mt-1">
              Submitted {new Date(submission.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`chip ${
              status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                : status === 'approved'
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 card-filled">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mileage</p>
            <p className="font-semibold text-gray-900 text-lg">{submission.mileage?.toLocaleString()} mi</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price</p>
            <p className="font-semibold text-gray-900 text-lg">${submission.price?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Condition</p>
            <p className="font-semibold text-gray-900 text-lg capitalize">{submission.condition}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Color</p>
            <p className="font-semibold text-gray-900 text-lg">{submission.color}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {status === 'pending' && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => onApprove(submission.id)}
              className="flex-1 bg-green-600 text-white px-6 py-4 rounded-full hover:shadow-md transition-all font-medium text-base active:scale-95"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onReject(submission.id)}
              className="flex-1 bg-red-600 text-white px-6 py-4 rounded-full hover:shadow-md transition-all font-medium text-base active:scale-95"
            >
              ✗ Reject
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setExpanded(!expanded);
            if (expanded) setImageModalOpen(false);
          }}
          className="w-full text-center btn-text py-3"
        >
          {expanded ? '↑ Hide Details' : '↓ Show More Details'}
        </button>

        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
            {/* Photo Gallery */}
            {images.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Photos ({images.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(idx);
                        setImageModalOpen(true);
                      }}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors shadow-sm hover:shadow-md"
                    >
                      <img
                        src={img}
                        alt={`Vehicle photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submission.description && (
              <div className="card-filled p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                <p className="text-gray-600">{submission.description}</p>
              </div>
            )}

            <div className="card-filled p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Contact Information</p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600"><span className="font-medium">Name:</span> {submission.seller_name}</p>
                <p className="text-gray-600"><span className="font-medium">Email:</span> {submission.seller_email}</p>
                <p className="text-gray-600"><span className="font-medium">Phone:</span> {submission.seller_phone}</p>
              </div>
            </div>

            {submission.trim && (
              <div className="card-filled p-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Trim</p>
                <p className="text-gray-600">{submission.trim}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-12 right-0 bg-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
            >
              ✕
            </button>
            <img
              src={images[selectedImage]}
              alt={`${submission.year} ${submission.make} ${submission.model}`}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="btn-filled"
                >
                  ← Previous
                </button>
                <span className="bg-white px-6 py-3 rounded-full font-medium shadow-sm">
                  {selectedImage + 1} / {images.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev + 1) % images.length);
                  }}
                  className="btn-filled"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Inventory</h1>

      {loading ? (
        <LoadingSpinner />
      ) : vehicles.length === 0 ? (
        <div className="card-elevated p-16 text-center">
          <p className="text-gray-500 text-lg">No vehicles in inventory</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="card-elevated overflow-hidden hover:shadow-lg transition-shadow">
      {vehicle.images?.[0] && (
        <img
          src={vehicle.images[0]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-52 object-cover"
        />
      )}
      <div className="p-5">
        <h3 className="font-semibold text-xl text-gray-900 mb-1">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        {vehicle.trim && (
          <p className="text-sm text-gray-600 mb-4">{vehicle.trim}</p>
        )}
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-primary">
            ${vehicle.price?.toLocaleString()}
          </span>
          <span className="text-sm text-gray-600 font-medium">
            {vehicle.mileage?.toLocaleString()} mi
          </span>
        </div>
        {vehicle.featured && (
          <span className="chip bg-yellow-100 text-yellow-800 border-yellow-200">
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Exports</h1>

      <div className="card-elevated p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Export to Jekyll Website</h2>
        <p className="text-base text-gray-600 mb-8">
          Download all approved vehicles as Jekyll data files and images for your static website.
        </p>

        <button
          onClick={handleJekyllExport}
          disabled={exporting}
          className="btn-filled w-full sm:w-auto px-8 py-4 text-base disabled:opacity-40"
        >
          {exporting ? 'Exporting...' : '📤 Download Jekyll Export'}
        </button>

        <div className="mt-8 p-6 bg-orange-100 rounded-xl">
          <h3 className="font-semibold text-primary-on-container mb-3 text-lg">What's included:</h3>
          <ul className="list-disc list-inside text-sm text-primary-on-container space-y-2">
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
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">{title}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
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
