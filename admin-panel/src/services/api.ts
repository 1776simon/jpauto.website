// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://jp-auto-inventory-production.up.railway.app';

// Type definitions
export interface User {
  id: number;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export interface Submission {
  id: number | string;
  submissionStatus: 'pending' | 'approved' | 'rejected';
  status?: 'pending' | 'approved' | 'rejected'; // Alias
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  mileage: number;
  condition: string;
  description?: string;
  images: string[];
  submittedAt: string;
  reviewedAt?: string;
  createdAt?: string; // Alias for compatibility
  updatedAt?: string; // Alias for compatibility
  created_at?: string; // Alias for compatibility
  updated_at?: string; // Alias for compatibility
}

export interface InventoryItem {
  id: number | string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  mileage: number;
  price: number | string;
  condition: string;
  description?: string;
  images: string[];
  status: 'available' | 'sold' | 'pending';
  created_at: string;
  updated_at: string;
  createdAt?: string; // Alias for compatibility
  updatedAt?: string; // Alias for compatibility
}

export interface InventoryStats {
  total: number;
  available: number;
  sold: number;
  pending: number;
  totalValue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmissionsResponse {
  submissions: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryResponse {
  inventory: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Helper Class
class ApiService {
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const config: RequestInit = {
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

  // ===== Auth endpoints =====
  async checkAuthStatus(): Promise<AuthStatus> {
    return this.request<AuthStatus>('/auth/status');
  }

  getLoginUrl(): string {
    return `${API_URL}/auth/google`;
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', { method: 'POST' });
  }

  // ===== Submissions endpoints =====
  async getSubmissions(
    status: 'all' | 'pending' | 'approved' | 'rejected' = 'all',
    page = 1,
    limit = 20
  ): Promise<SubmissionsResponse> {
    const params = new URLSearchParams();
    if (status !== 'all') params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const query = params.toString();
    return this.request<SubmissionsResponse>(`/api/submissions?${query}`);
  }

  async approveSubmission(id: number): Promise<Submission> {
    return this.request<Submission>(`/api/submissions/${id}/approve`, { method: 'POST' });
  }

  async rejectSubmission(id: number, reason = ''): Promise<Submission> {
    return this.request<Submission>(`/api/submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteSubmission(id: number): Promise<void> {
    return this.request<void>(`/api/submissions/${id}`, { method: 'DELETE' });
  }

  // ===== Inventory endpoints =====
  async getInventory(filters: Record<string, any> = {}): Promise<InventoryResponse> {
    const query = new URLSearchParams(filters).toString();
    return this.request<InventoryResponse>(`/api/inventory${query ? '?' + query : ''}`);
  }

  async getInventoryStats(): Promise<InventoryStats> {
    return this.request<InventoryStats>('/api/inventory/stats');
  }

  async createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request<InventoryItem>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request<InventoryItem>(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventoryItem(id: number): Promise<void> {
    return this.request<void>(`/api/inventory/${id}`, { method: 'DELETE' });
  }

  // ===== Export endpoints =====
  async exportToJekyll(): Promise<void> {
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

  async exportToAutoTrader(): Promise<void> {
    const url = `${API_URL}/api/exports/autotrader`;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `autotrader-export-${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }

  async exportToCarGurus(): Promise<void> {
    const url = `${API_URL}/api/exports/cargurus`;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `cargurus-export-${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }

  async exportToFacebook(): Promise<void> {
    const url = `${API_URL}/api/exports/facebook`;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `facebook-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }

  async exportToDealerCenter(): Promise<void> {
    const url = `${API_URL}/api/exports/dealer-center`;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `dealer-center-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }
}

export default new ApiService();
export { API_URL };
