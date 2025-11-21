import { A } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';

export default function Layout(props) {
  const { user, logout } = useAuth();

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <aside class="nav-rail">
        <div class="p-6">
          <h1 class="text-2xl font-bold text-gray-900">JP Auto</h1>
          <p class="text-sm text-gray-600">Admin Panel</p>
        </div>

        <nav class="mt-6 space-y-2">
          <A href="/dashboard" class="nav-item" activeClass="nav-item-active">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </A>

          <A href="/submissions" class="nav-item" activeClass="nav-item-active">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Submissions</span>
          </A>

          <A href="/inventory" class="nav-item" activeClass="nav-item-active">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Inventory</span>
          </A>

          <A href="/exports" class="nav-item" activeClass="nav-item-active">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <button onClick={logout} class="btn-outlined w-full text-xs py-2">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main class="ml-64 p-8">
        {props.children}
      </main>
    </div>
  );
}
