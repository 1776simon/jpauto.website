// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://api.jpautomotivegroup.com';

// API Helper
class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      ...options,
      credentials: 'include', // Important for cookies/sessions
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth endpoints
  async checkAuthStatus() {
    return this.request('/auth/status');
  }

  getLoginUrl() {
    return `${API_URL}/auth/google`;
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Submissions endpoints
  async getSubmissions(status = 'all') {
    const query = status !== 'all' ? `?status=${status}` : '';
    return this.request(`/api/submissions${query}`);
  }

  async approveSubmission(id) {
    return this.request(`/api/submissions/${id}/approve`, { method: 'POST' });
  }

  async rejectSubmission(id, reason = '') {
    return this.request(`/api/submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Inventory endpoints
  async getInventory(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/api/inventory${query ? '?' + query : ''}`);
  }

  async getInventoryStats() {
    return this.request('/api/inventory/stats');
  }

  // Export endpoints
  async exportToJekyll() {
    const url = `${API_URL}/api/exports/jekyll`;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    // Download the file
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `jp-auto-vehicles-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }
}

export default new ApiService();
export { API_URL };
