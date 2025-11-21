import { createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Exports() {
  const { user, logout } = useAuth();
  const [exporting, setExporting] = createSignal(false);

  const handleExport = async (type, format) => {
    try {
      setExporting(true);

      let blob;
      let filename;

      if (type === 'submissions') {
        blob = await api.exportSubmissions(format);
        filename = `submissions-${new Date().toISOString().split('T')[0]}.${format}`;
      } else {
        blob = await api.exportInventory(format);
        filename = `inventory-${new Date().toISOString().split('T')[0]}.${format}`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <aside class="nav-rail">
        <div class="p-6">
          <h1 class="text-2xl font-bold text-gray-900">JP Auto</h1>
          <p class="text-sm text-gray-600">Admin Panel</p>
        </div>

        <nav class="mt-6 space-y-2">
          <A href="/dashboard" class="nav-item">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </A>

          <A href="/submissions" class="nav-item">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Submissions</span>
          </A>

          <A href="/inventory" class="nav-item">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Inventory</span>
          </A>

          <A href="/exports" class="nav-item nav-item-active">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exports</span>
          </A>
        </nav>

        {/* User Section */}
        <div class="mt-auto p-4 border-t border-gray-200">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              {user()?.name?.charAt(0) || 'U'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 truncate">{user()?.name}</p>
              <p class="text-xs text-gray-500 truncate">{user()?.email}</p>
            </div>
          </div>
          <button onClick={logout} class="btn-outlined w-full text-xs py-2">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main class="ml-64 p-8">
        <div class="max-w-4xl mx-auto">
          {/* Header */}
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Export Data</h2>
            <p class="text-gray-600 mt-1">Download your data in various formats</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Submissions Export */}
            <div class="card-elevated p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">Submissions</h3>
                  <p class="text-sm text-gray-600">Export consignment submissions</p>
                </div>
              </div>

              <p class="text-sm text-gray-600 mb-6">
                Download all consignment submission data including vehicle details, seller information, and status.
              </p>

              <div class="space-y-3">
                <button
                  onClick={() => handleExport('submissions', 'csv')}
                  disabled={exporting()}
                  class="btn-filled w-full justify-center"
                >
                  <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting() ? 'Exporting...' : 'Export as CSV'}
                </button>

                <button
                  onClick={() => handleExport('submissions', 'xlsx')}
                  disabled={exporting()}
                  class="btn-outlined w-full justify-center"
                >
                  <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting() ? 'Exporting...' : 'Export as Excel'}
                </button>
              </div>
            </div>

            {/* Inventory Export */}
            <div class="card-elevated p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">Inventory</h3>
                  <p class="text-sm text-gray-600">Export vehicle inventory</p>
                </div>
              </div>

              <p class="text-sm text-gray-600 mb-6">
                Download all inventory data including vehicle specifications, pricing, images, and stock information.
              </p>

              <div class="space-y-3">
                <button
                  onClick={() => handleExport('inventory', 'csv')}
                  disabled={exporting()}
                  class="btn-filled w-full justify-center"
                >
                  <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting() ? 'Exporting...' : 'Export as CSV'}
                </button>

                <button
                  onClick={() => handleExport('inventory', 'xlsx')}
                  disabled={exporting()}
                  class="btn-outlined w-full justify-center"
                >
                  <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting() ? 'Exporting...' : 'Export as Excel'}
                </button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div class="mt-8 card-outlined p-6">
            <h4 class="font-semibold text-gray-900 mb-3">Export Information</h4>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-start gap-2">
                <svg class="w-3 h-3 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>CSV Format:</strong> Compatible with Excel, Google Sheets, and most data analysis tools</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-3 h-3 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Excel Format:</strong> Opens directly in Microsoft Excel with formatted columns</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-3 h-3 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Exports include all data fields and are generated in real-time</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-3 h-3 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Downloaded files are named with the current date for easy organization</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
