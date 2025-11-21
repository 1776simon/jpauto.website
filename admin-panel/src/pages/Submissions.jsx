import { createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Submissions() {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [filter, setFilter] = createSignal('all');
  const [selectedSubmission, setSelectedSubmission] = createSignal(null);

  onMount(async () => {
    await loadSubmissions();
  });

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await api.getSubmissions({});
      setSubmissions(data.data || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = () => {
    const items = submissions();
    if (filter() === 'all') return items;
    return items.filter(s => s.status === filter());
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.updateSubmissionStatus(id, newStatus);
      await loadSubmissions();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const deleteSubmission = async (id) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      await api.deleteSubmission(id);
      await loadSubmissions();
    } catch (error) {
      console.error('Failed to delete submission:', error);
      alert('Failed to delete submission');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

          <A href="/submissions" class="nav-item nav-item-active">
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
        <div class="max-w-7xl mx-auto">
          {/* Header */}
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Consignment Submissions</h2>
            <p class="text-gray-600 mt-1">Manage vehicle consignment requests</p>
          </div>

          {/* Filters */}
          <div class="mb-6 flex gap-3">
            <button
              onClick={() => setFilter('all')}
              class={filter() === 'all' ? 'chip bg-primary text-white' : 'chip'}
            >
              All ({submissions().length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              class={filter() === 'pending' ? 'chip bg-primary text-white' : 'chip'}
            >
              Pending ({submissions().filter(s => s.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              class={filter() === 'approved' ? 'chip bg-primary text-white' : 'chip'}
            >
              Approved ({submissions().filter(s => s.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              class={filter() === 'rejected' ? 'chip bg-primary text-white' : 'chip'}
            >
              Rejected ({submissions().filter(s => s.status === 'rejected').length})
            </button>
          </div>

          {/* Submissions Table */}
          <div class="card-elevated">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-4 px-6 text-sm font-semibold text-gray-600">Vehicle</th>
                    <th class="text-left py-4 px-6 text-sm font-semibold text-gray-600">Seller</th>
                    <th class="text-left py-4 px-6 text-sm font-semibold text-gray-600">Contact</th>
                    <th class="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                    <th class="text-left py-4 px-6 text-sm font-semibold text-gray-600">Date</th>
                    <th class="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={!loading()}
                    fallback={
                      <tr>
                        <td colspan="6" class="text-center py-12">
                          <div class="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p class="mt-4 text-gray-600">Loading submissions...</p>
                        </td>
                      </tr>
                    }
                  >
                    <For
                      each={filteredSubmissions()}
                      fallback={
                        <tr>
                          <td colspan="6" class="text-center py-12 text-gray-500">
                            No submissions found
                          </td>
                        </tr>
                      }
                    >
                      {(submission) => (
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                          <td class="py-4 px-6">
                            <p class="font-medium text-gray-900">
                              {submission.year} {submission.make} {submission.model}
                            </p>
                            <p class="text-sm text-gray-500">VIN: {submission.vin || 'N/A'}</p>
                          </td>
                          <td class="py-4 px-6">
                            <p class="text-gray-900">{submission.sellerName}</p>
                          </td>
                          <td class="py-4 px-6">
                            <p class="text-sm text-gray-600">{submission.email}</p>
                            <p class="text-sm text-gray-600">{submission.phone}</p>
                          </td>
                          <td class="py-4 px-6">
                            <span class={`chip ${getStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                          </td>
                          <td class="py-4 px-6 text-gray-600">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </td>
                          <td class="py-4 px-6">
                            <div class="flex gap-2">
                              <Show when={submission.status === 'pending'}>
                                <button
                                  onClick={() => updateStatus(submission.id, 'approved')}
                                  class="btn-text text-xs text-green-600"
                                  title="Approve"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => updateStatus(submission.id, 'rejected')}
                                  class="btn-text text-xs text-red-600"
                                  title="Reject"
                                >
                                  ✕
                                </button>
                              </Show>
                              <button
                                onClick={() => setSelectedSubmission(submission)}
                                class="btn-text text-xs"
                                title="View Details"
                              >
                                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteSubmission(submission.id)}
                                class="btn-text text-xs text-red-600"
                                title="Delete"
                              >
                                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Modal */}
          <Show when={selectedSubmission()}>
            <div
              class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedSubmission(null)}
            >
              <div
                class="card-elevated max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div class="flex justify-between items-start mb-6">
                  <h3 class="text-2xl font-bold text-gray-900">Submission Details</h3>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div class="space-y-4">
                  <div>
                    <h4 class="font-semibold text-gray-700 mb-2">Vehicle Information</h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div><span class="text-gray-600">Year:</span> {selectedSubmission().year}</div>
                      <div><span class="text-gray-600">Make:</span> {selectedSubmission().make}</div>
                      <div><span class="text-gray-600">Model:</span> {selectedSubmission().model}</div>
                      <div><span class="text-gray-600">VIN:</span> {selectedSubmission().vin || 'N/A'}</div>
                      <div><span class="text-gray-600">Mileage:</span> {selectedSubmission().mileage || 'N/A'}</div>
                      <div><span class="text-gray-600">Condition:</span> {selectedSubmission().condition || 'N/A'}</div>
                    </div>
                  </div>

                  <div>
                    <h4 class="font-semibold text-gray-700 mb-2">Seller Information</h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div><span class="text-gray-600">Name:</span> {selectedSubmission().sellerName}</div>
                      <div><span class="text-gray-600">Email:</span> {selectedSubmission().email}</div>
                      <div><span class="text-gray-600">Phone:</span> {selectedSubmission().phone}</div>
                    </div>
                  </div>

                  <Show when={selectedSubmission().notes}>
                    <div>
                      <h4 class="font-semibold text-gray-700 mb-2">Additional Notes</h4>
                      <p class="text-sm text-gray-600">{selectedSubmission().notes}</p>
                    </div>
                  </Show>

                  <div class="pt-4 flex gap-3">
                    <button onClick={() => setSelectedSubmission(null)} class="btn-outlined flex-1">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </main>
    </div>
  );
}
