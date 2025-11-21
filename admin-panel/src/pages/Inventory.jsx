import { createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Inventory() {
  const { user, logout } = useAuth();
  const [inventory, setInventory] = createSignal([]);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    await loadInventory();
  });

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory({});
      setInventory(data.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await api.deleteInventoryItem(id);
      await loadInventory();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
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

          <A href="/inventory" class="nav-item nav-item-active">
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
          <div class="mb-8 flex justify-between items-center">
            <div>
              <h2 class="text-3xl font-bold text-gray-900">Vehicle Inventory</h2>
              <p class="text-gray-600 mt-1">Manage vehicles available for sale</p>
            </div>
            <button class="btn-filled">
              <svg class="w-3 h-3 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Vehicle
            </button>
          </div>

          {/* Inventory Grid */}
          <Show
            when={!loading()}
            fallback={
              <div class="text-center py-12">
                <div class="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="mt-4 text-gray-600">Loading inventory...</p>
              </div>
            }
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <For
                each={inventory()}
                fallback={
                  <div class="col-span-full text-center py-12">
                    <svg class="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p class="mt-4 text-gray-500 text-lg">No vehicles in inventory</p>
                    <p class="text-gray-400 text-sm">Add your first vehicle to get started</p>
                  </div>
                }
              >
                {(vehicle) => (
                  <div class="card-elevated overflow-hidden">
                    {/* Vehicle Image */}
                    <div class="aspect-video bg-gray-200 relative">
                      <Show
                        when={vehicle.images && vehicle.images.length > 0}
                        fallback={
                          <div class="w-full h-full flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        }
                      >
                        <img
                          src={vehicle.images[0]}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          class="w-full h-full object-cover"
                        />
                      </Show>

                      {/* Price Badge */}
                      <div class="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full font-semibold">
                        {formatPrice(vehicle.price)}
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div class="p-4">
                      <h3 class="text-lg font-bold text-gray-900 mb-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>

                      <div class="space-y-2 text-sm text-gray-600 mb-4">
                        <div class="flex items-center gap-2">
                          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{vehicle.mileage?.toLocaleString()} miles</span>
                        </div>
                        <Show when={vehicle.vin}>
                          <div class="flex items-center gap-2">
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span class="font-mono text-xs">{vehicle.vin}</span>
                          </div>
                        </Show>
                        <Show when={vehicle.stockNumber}>
                          <div class="flex items-center gap-2">
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>Stock #{vehicle.stockNumber}</span>
                          </div>
                        </Show>
                      </div>

                      {/* Actions */}
                      <div class="flex gap-2 pt-3 border-t border-gray-100">
                        <button class="btn-outlined flex-1 text-sm">
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVehicle(vehicle.id)}
                          class="btn-text text-sm text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </main>
    </div>
  );
}
