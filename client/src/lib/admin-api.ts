// Default to localhost:3001 for development, will be overridden in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AdminApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Dashboard APIs
  async getDashboardStats<T>() {
    return this.request<T>('/admin/dashboard/stats');
  }

  async getRecentOrders<T>(limit: number = 10) {
    return this.request<T>(`/admin/orders/recent?limit=${limit}`);
  }

  async getOrdersNeedingAttention<T>() {
    return this.request<T>('/admin/orders/attention');
  }

  async getRevenueData<T>(days: number = 30) {
    return this.request<T>(`/admin/orders/revenue-data?days=${days}`);
  }

  // Inventory APIs
  async getInventory<T>(filters: {
    lowStockOnly?: boolean;
    activeProductsOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<T>(`/admin/inventory?${params.toString()}`);
  }

  async getLowStockProducts<T>() {
    return this.request<T>('/admin/inventory/low-stock');
  }

  async restockProduct(productId: string, quantity: number, reason?: string) {
    return this.request('/admin/inventory/restock', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, reason })
    });
  }

  async bulkRestock(items: Array<{ productId: string; quantity: number; reason?: string }>) {
    return this.request('/admin/inventory/bulk-restock', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  }

  async updateInventory(productId: string, data: {
    currentStock?: number;
    reservedStock?: number;
    lowStockThreshold?: number;
  }) {
    return this.request(`/admin/inventory/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateInventorySettings(productId: string, settings: { lowStockThreshold: number }) {
    return this.request(`/admin/inventory/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Product APIs
  async getProducts<T>(filters: {
    category?: string;
    packageSize?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<T>(`/admin/products?${params.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/admin/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/admin/products/${id}`, {
      method: 'DELETE'
    });
  }

  async bulkUpdateProducts(updates: Array<{ id: string; data: any }>) {
    return this.request('/admin/products/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ updates })
    });
  }

  // Order APIs
  async getOrders<T>(filters: {
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<T>(`/admin/orders?${params.toString()}`);
  }

  async getOrder(id: string) {
    return this.request(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string, trackingInfo?: {
    shippingCarrier?: string;
    trackingNumber?: string;
  }) {
    return this.request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...trackingInfo })
    });
  }

  async bulkUpdateOrderStatus(orderIds: string[], status: string, trackingInfo?: {
    carrier?: string;
    trackingNumber?: string;
  }) {
    return this.request('/admin/orders/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify({ orderIds, status, trackingInfo })
    });
  }

  async cancelOrder(id: string, reason: string) {
    return this.request(`/admin/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async addOrderTracking(id: string, shippingCarrier: string, trackingNumber: string) {
    return this.request(`/admin/orders/${id}/add-tracking`, {
      method: 'POST',
      body: JSON.stringify({ shippingCarrier, trackingNumber })
    });
  }

  // SSE APIs
  async getSSEStats() {
    return this.request('/admin/events/stats');
  }

  async sendTestEvent(message?: string) {
    return this.request('/admin/events/test', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Analytics APIs
  async getAnalyticsOverview<T>(period: number = 30) {
    return this.request<T>(`/admin/analytics/overview?period=${period}`);
  }

  async getSalesAnalytics<T>(period: number = 30) {
    return this.request<T>(`/admin/analytics/sales?period=${period}`);
  }

  async getCustomerAnalytics<T>(period: number = 30) {
    return this.request<T>(`/admin/analytics/customers?period=${period}`);
  }

  // User Management APIs
  async getUsers<T>(filters: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    return this.request<T>(`/admin/users?${params.toString()}`);
  }

  async getUserStats<T>() {
    return this.request<T>('/admin/users/stats');
  }

  async getUser(id: string) {
    return this.request(`/admin/users/${id}`);
  }

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'admin' | 'super_admin';
    password: string;
  }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id: string, userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: 'customer' | 'admin' | 'super_admin';
    isActive?: boolean;
  }) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async promoteUser(id: string, role: 'admin' | 'super_admin') {
    return this.request(`/admin/users/${id}/promote`, {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  }

  async deleteUser(id: string) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Affiliate Management APIs
  async getAffiliateAnalytics<T>() {
    return this.request<T>('/admin/affiliates/analytics');
  }

  async getAffiliateApplications<T>(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<T>(`/admin/affiliates/applications?${params.toString()}`);
  }

  async getAffiliates<T>(filters: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<T>(`/admin/affiliates?${params.toString()}`);
  }

  async getAffiliatePayouts<T>(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<T>(`/admin/affiliates/payouts?${params.toString()}`);
  }

  async reviewAffiliateApplication(applicationId: string, action: 'approve' | 'reject', adminNotes?: string) {
    return this.request(`/admin/affiliates/applications/${applicationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNotes })
    });
  }

  async bulkAffiliateActions(data: {
    action: string;
    affiliateIds: string[];
    reason?: string;
  }) {
    return this.request('/admin/affiliates/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async processAffiliatePayout(data: {
    affiliateIds: string[];
    amount?: number;
    method: 'stripe' | 'manual';
  }) {
    return this.request('/admin/affiliates/payouts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Audit Log Management APIs
  async getAuditLogs<T>(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<T>(`/admin/audit-logs?${params.toString()}`);
  }

  async getAuditLogStats<T>() {
    return this.request<T>('/admin/audit-logs/stats');
  }

  async getAuditLog(id: string) {
    return this.request(`/admin/audit-logs/${id}`);
  }
}

export const adminApi = new AdminApiClient();
export default adminApi;