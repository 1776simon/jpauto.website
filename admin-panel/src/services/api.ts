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
  status: 'available' | 'sold' | 'pending' | 'hold';
  featured?: boolean;

  // Vehicle basic information
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  stockNumber?: string;
  stock_number?: string; // Alias

  // Pricing
  price: number | string;
  cost?: number | string;
  msrp?: number | string;

  // Vehicle details
  mileage: number;
  exteriorColor?: string;
  exterior_color?: string; // Alias
  interiorColor?: string;
  interior_color?: string; // Alias
  transmission?: string;
  engine?: string;
  fuelType?: string;
  fuel_type?: string; // Alias
  drivetrain?: string;
  bodyType?: string;
  body_type?: string; // Alias
  doors?: number;
  titleStatus?: string;
  title_status?: string; // Alias

  // Performance
  mpgCity?: number;
  mpg_city?: number; // Alias
  mpgHighway?: number;
  mpg_highway?: number; // Alias
  horsepower?: number;

  // Features & images
  features?: string[];
  images: string[];
  primaryImageUrl?: string;
  primary_image_url?: string; // Alias

  // History
  previousOwners?: string; // Changed to string for "1", "2", "3", "4+"
  previous_owners?: string; // Alias
  accidentHistory?: string; // Values: "No accidents", "1", "2", "3", "4+ accidents"
  accident_history?: string; // Alias
  serviceRecordsOnFile?: string; // Renamed: "Less than 5", "5-10", "10-20", "20+ records"
  service_records_on_file?: string; // Alias
  serviceRecords?: string; // Deprecated - backward compatibility
  service_records?: string; // Deprecated - backward compatibility
  carfaxAvailable?: boolean;
  carfax_available?: boolean; // Alias
  carfaxUrl?: string;
  carfax_url?: string; // Alias

  // Warranty & description
  warrantyDescription?: string;
  warranty_description?: string; // Alias
  description?: string;
  marketingTitle?: string;
  marketing_title?: string; // Alias
  condition?: string; // Legacy field

  // Metadata
  source?: string;
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
  totalCost: number;
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

  // ===== Photo Management =====
  async uploadInventoryPhotos(id: number, files: File[]): Promise<{ images: string[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const url = `${API_URL}/api/inventory/${id}/images`;

    // Use XMLHttpRequest instead of fetch() for better Safari/iOS compatibility
    // Safari has known issues with fetch() for large multipart uploads
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || error.error || 'Failed to upload photos'));
          } catch {
            reject(new Error(`HTTP ${xhr.status}: Failed to upload photos`));
          }
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error - failed to upload photos'));
      };

      xhr.ontimeout = function() {
        reject(new Error('Upload timed out - please try with fewer photos'));
      };

      // Set timeout to 5 minutes for large uploads
      xhr.timeout = 300000;

      xhr.open('POST', url);

      // Important: credentials must be set for CORS with cookies
      xhr.withCredentials = true;

      // Don't set Content-Type header - browser will set it automatically with boundary
      xhr.send(formData);
    });
  }

  async reorderInventoryPhotos(id: number, imageUrls: string[]): Promise<{ images: string[] }> {
    return this.request<{ images: string[] }>(`/api/inventory/${id}/photos/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ imageUrls }),
    });
  }

  async deleteInventoryPhoto(id: number, imageUrl: string): Promise<{ images: string[] }> {
    return this.request<{ images: string[] }>(`/api/inventory/${id}/photos`, {
      method: 'DELETE',
      body: JSON.stringify({ imageUrl }),
    });
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
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();

    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = '29007654_' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '.csv';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }

  async decodeVIN(vin: string): Promise<any> {
    const url = `${API_URL}/api/vin/decode`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vin }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to decode VIN');
    }

    const result = await response.json();
    return result.data;
  }
}

export default new ApiService();
export { API_URL };
