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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JP Auto</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm"
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
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className={`text-xl font-bold text-primary transition-opacity ${!sidebarOpen && 'opacity-0 w-0 overflow-hidden'}`}>JP Auto Admin</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
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
        <div className="p-4 sm:p-6 lg:p-8">
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
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/dashboard/submissions"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Review Submissions</h3>
            <p className="text-sm text-gray-600">Approve or reject pending vehicles</p>
          </Link>
          <Link
            to="/dashboard/exports"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Export Data</h3>
            <p className="text-sm text-gray-600">Download inventory for website</p>
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
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Submissions</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-sm"
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
        <div className="space-y-4 sm:space-y-6">
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

  // API returns submissionStatus, not status
  const status = submission.submissionStatus || submission.status;

  // Parse images - could be JSON string or array
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
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
              status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : status === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Mileage</p>
            <p className="font-semibold text-gray-900">{submission.mileage?.toLocaleString()} mi</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="font-semibold text-gray-900">${submission.price?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Condition</p>
            <p className="font-semibold text-gray-900 capitalize">{submission.condition}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Color</p>
            <p className="font-semibold text-gray-900">{submission.color}</p>
          </div>
        </div>

        {/* Action Buttons - Always visible for pending submissions */}
        {status === 'pending' && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => onApprove(submission.id)}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onReject(submission.id)}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
            >
              ✗ Reject
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setExpanded(!expanded);
            if (expanded) setImageModalOpen(false); // Close modal when collapsing
          }}
          className="w-full text-center text-primary hover:text-primary-dark font-medium py-2 hover:bg-gray-50 rounded transition-colors"
        >
          {expanded ? '↑ Hide Details' : '↓ Show More Details'}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Photo Gallery - Now in expandable section */}
            {images.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Photos ({images.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(idx);
                        setImageModalOpen(true);
                      }}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors"
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
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
                <p className="text-gray-600">{submission.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Contact Information</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600"><span className="font-medium">Name:</span> {submission.seller_name}</p>
                <p className="text-gray-600"><span className="font-medium">Email:</span> {submission.seller_email}</p>
                <p className="text-gray-600"><span className="font-medium">Phone:</span> {submission.seller_phone}</p>
              </div>
            </div>

            {/* Additional details if available */}
            {submission.trim && (
              <div>
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
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
            <img
              src={images[selectedImage]}
              alt={`${submission.year} ${submission.make} ${submission.model}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="bg-white px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ← Previous
                </button>
                <span className="bg-white px-4 py-2 rounded-lg">
                  {selectedImage + 1} / {images.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev + 1) % images.length);
                  }}
                  className="bg-white px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
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
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Inventory</h1>

      {loading ? (
        <LoadingSpinner />
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No vehicles in inventory</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Exports</h1>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Export to Jekyll Website</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Download all approved vehicles as Jekyll data files and images for your static website.
        </p>

        <button
          onClick={handleJekyllExport}
          disabled={exporting}
          className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
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
