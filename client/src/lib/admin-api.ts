const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getRecentOrders(limit: number = 10) {
    return this.request(`/admin/orders/recent?limit=${limit}`);
  }

  async getOrdersNeedingAttention() {
    return this.request('/admin/orders/attention');
  }

  async getRevenueData(days: number = 30) {
    return this.request(`/admin/orders/revenue-data?days=${days}`);
  }

  // Inventory APIs
  async getInventory(filters: {
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

    return this.request(`/admin/inventory?${params.toString()}`);
  }

  async getLowStockProducts() {
    return this.request('/admin/inventory/low-stock');
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
  async getProducts(filters: {
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

    return this.request(`/admin/products?${params.toString()}`);
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
  async getOrders(filters: {
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

    return this.request(`/admin/orders?${params.toString()}`);
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
  async getAnalyticsOverview(period: number = 30) {
    return this.request(`/admin/analytics/overview?period=${period}`);
  }

  async getSalesAnalytics(period: number = 30) {
    return this.request(`/admin/analytics/sales?period=${period}`);
  }

  async getCustomerAnalytics(period: number = 30) {
    return this.request(`/admin/analytics/customers?period=${period}`);
  }

  // User Management APIs
  async getUsers(filters: {
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
    
    return this.request(`/admin/users?${params.toString()}`);
  }

  async getUserStats() {
    return this.request('/admin/users/stats');
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
  async getAffiliateAnalytics() {
    return this.request('/admin/affiliates/analytics');
  }

  async getAffiliateApplications(filters: {
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

    return this.request(`/admin/affiliates/applications?${params.toString()}`);
  }

  async getAffiliates(filters: {
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

    return this.request(`/admin/affiliates?${params.toString()}`);
  }

  async getAffiliatePayouts(filters: {
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

    return this.request(`/admin/affiliates/payouts?${params.toString()}`);
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
  async getAuditLogs(filters: {
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

    return this.request(`/admin/audit-logs?${params.toString()}`);
  }

  async getAuditLogStats() {
    return this.request('/admin/audit-logs/stats');
  }

  async getAuditLog(id: string) {
    return this.request(`/admin/audit-logs/${id}`);
  }
}

export const adminApi = new AdminApiClient();
export default adminApi;