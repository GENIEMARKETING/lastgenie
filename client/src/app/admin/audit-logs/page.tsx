'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface AuditLogStats {
  totalLogs: number;
  logsLast24Hours: number;
  logsLast7Days: number;
  logsLast30Days: number;
  topActions: Array<{ action: string; count: number }>;
  topEntities: Array<{ entity: string; count: number }>;
  topUsers: Array<{ userId: string; count: number; user: any }>;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entity: '',
    entityId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAuditLogs<{
        logs: AuditLog[];
        pagination: {
          totalPages: number;
        };
      }>({
        ...filters,
        page: currentPage,
        limit: 25
      });

      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getAuditLogStats<AuditLogStats>();

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching audit log stats:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entity: '',
      entityId: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('update')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete')) return 'bg-red-100 text-red-800';
    if (action.includes('approve')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEntityBadgeColor = (entity: string) => {
    switch (entity.toLowerCase()) {
      case 'user': return 'bg-indigo-100 text-indigo-800';
      case 'product': return 'bg-orange-100 text-orange-800';
      case 'order': return 'bg-teal-100 text-teal-800';
      case 'affiliate': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !logs.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Audit Logs
          </h1>
          <p className="text-text-secondary mt-2">
            System activity and change tracking
          </p>
        </div>
        
        <Button onClick={fetchLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Total Logs</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalLogs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Last 24h</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.logsLast24Hours}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Last 7 days</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.logsLast7Days}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Last 30 days</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.logsLast30Days}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="e.g., user_created"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="entity">Entity</Label>
              <Input
                id="entity"
                placeholder="e.g., user, product"
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="entityId">Entity ID</Label>
              <Input
                id="entityId"
                placeholder="Entity ID"
                value={filters.entityId}
                onChange={(e) => handleFilterChange('entityId', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} className="bg-primary hover:bg-primary-dark">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No audit logs found matching the current filters.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-border-default rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge className={getEntityBadgeColor(log.entity)}>
                          {log.entity}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-text-secondary">
                        <span className="font-medium">Entity ID:</span> {log.entityId}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-text-secondary">
                        {log.user && (
                          <div>
                            <span className="font-medium">User:</span> {log.user.firstName} {log.user.lastName}
                          </div>
                        )}
                        <div>{formatDate(log.createdAt)}</div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {log.metadata && (
                    <div className="mt-2 text-sm text-text-secondary">
                      <span className="font-medium">Metadata:</span> {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-text-secondary">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Audit Log Details</h3>
                <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <strong>ID:</strong> {selectedLog.id}
                </div>
                <div>
                  <strong>Action:</strong> <Badge className={getActionBadgeColor(selectedLog.action)}>{selectedLog.action}</Badge>
                </div>
                <div>
                  <strong>Entity:</strong> <Badge className={getEntityBadgeColor(selectedLog.entity)}>{selectedLog.entity}</Badge>
                </div>
                <div>
                  <strong>Entity ID:</strong> {selectedLog.entityId}
                </div>
                {selectedLog.user && (
                  <div>
                    <strong>User:</strong> {selectedLog.user.firstName} {selectedLog.user.lastName} ({selectedLog.user.email})
                  </div>
                )}
                <div>
                  <strong>Created At:</strong> {formatDate(selectedLog.createdAt)}
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <strong>IP Address:</strong> {selectedLog.ipAddress}
                  </div>
                )}
                {selectedLog.oldValues && (
                  <div>
                    <strong>Old Values:</strong>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.newValues && (
                  <div>
                    <strong>New Values:</strong>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.metadata && (
                  <div>
                    <strong>Metadata:</strong>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}