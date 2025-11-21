import { createSignal, onMount, For } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = createSignal({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalInventory: 0,
    recentSubmissions: [],
  });
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    try {
      setLoading(true);
      // Fetch dashboard stats
      const [submissions, inventory] = await Promise.all([
        api.getSubmissions({ limit: 5 }),
        api.getInventory({ limit: 1 }),
      ]);

      setStats({
        totalSubmissions: submissions.total || 0,
        pendingSubmissions: submissions.data?.filter(s => s.status === 'pending').length || 0,
        totalInventory: inventory.total || 0,
        recentSubmissions: submissions.data || [],
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <aside class="nav-rail">
        <div class="p-6">
          <h1 class="text-2xl font-bold text-gray-900">JP Auto</h1>
          <p class="text-sm text-gray-600">Admin Panel</p>
        </div>

        <nav class="mt-6 space-y-2">
          <A href="/dashboard" class="nav-item nav-item-active">
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

          <A href="/exports" class="nav-item">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exports</span>
          </A>
        </nav>

        {/* User Section */}
        <div class="mt-auto p-4 border-t border-gray-200">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user()?.name?.charAt(0) || 'U'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 truncate">{user()?.name}</p>
              <p class="text-xs text-gray-500 truncate">{user()?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            class="btn-outlined w-full text-xs py-2"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main class="ml-64 p-8">
        <div class="max-w-7xl mx-auto">
          {/* Header */}
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p class="text-gray-600 mt-1">Welcome back, {user()?.name}</p>
          </div>

          {/* Stats Cards */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="card-elevated p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">{stats().totalSubmissions}</p>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="card-elevated p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Pending Review</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">{stats().pendingSubmissions}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="card-elevated p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Inventory</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">{stats().totalInventory}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div class="card-elevated p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Recent Submissions</h3>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-600">Vehicle</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-600">Seller</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <For
                    each={stats().recentSubmissions}
                    fallback={
                      <tr>
                        <td colspan="4" class="text-center py-8 text-gray-500">
                          {loading() ? 'Loading...' : 'No submissions yet'}
                        </td>
                      </tr>
                    }
                  >
                    {(submission) => (
                      <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4">
                          <p class="font-medium text-gray-900">
                            {submission.year} {submission.make} {submission.model}
                          </p>
                        </td>
                        <td class="py-3 px-4 text-gray-600">{submission.sellerName}</td>
                        <td class="py-3 px-4">
                          <span class={`chip ${
                            submission.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-gray-600">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

            <div class="mt-4 text-center">
              <A href="/submissions" class="btn-text">
                View All Submissions
              </A>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
