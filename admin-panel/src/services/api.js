const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.jpautomotivegroup.com';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async checkAuthStatus() {
    return this.request('/auth/status');
  }

  getLoginUrl() {
    return `${BASE_URL}/auth/google`;
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Consignment submissions
  async getSubmissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/submissions${queryString ? `?${queryString}` : ''}`);
  }

  async updateSubmissionStatus(id, status) {
    return this.request(`/submissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteSubmission(id) {
    return this.request(`/submissions/${id}`, { method: 'DELETE' });
  }

  // Inventory management
  async getInventory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory${queryString ? `?${queryString}` : ''}`);
  }

  async createInventoryItem(data) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id, data) {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventoryItem(id) {
    return this.request(`/inventory/${id}`, { method: 'DELETE' });
  }

  // Export functionality
  async exportSubmissions(format = 'csv', filters = {}) {
    const queryString = new URLSearchParams({ format, ...filters }).toString();
    const url = `${API_URL}/submissions/export?${queryString}`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  async exportInventory(format = 'csv', filters = {}) {
    const queryString = new URLSearchParams({ format, ...filters }).toString();
    const url = `${API_URL}/inventory/export?${queryString}`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}

export default new ApiService();
