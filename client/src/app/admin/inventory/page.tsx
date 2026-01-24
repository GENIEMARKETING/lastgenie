'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Archive,
  Edit,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/contexts/admin-context';
import adminApi from '@/lib/admin-api';

interface InventoryItem {
  id: string;
  productId: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  lastRestocked: string | null;
  totalSold: number;
  totalReceived: number;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    category: string;
    isActive: boolean;
  };
}

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onRestock: (productId: string, quantity: number, reason?: string) => void;
}

function RestockModal({ isOpen, onClose, item, onRestock }: RestockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !quantity) return;

    setIsSubmitting(true);
    try {
      await onRestock(item.productId, parseInt(quantity), reason || undefined);
      onClose();
      setQuantity('');
      setReason('');
    } catch (error) {
      console.error('Error restocking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border-default rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Restock {item.product.name}
        </h3>
        
        <div className="mb-4 p-3 bg-background rounded-lg">
          <p className="text-sm text-text-secondary">Current Stock: {item.currentStock}</p>
          <p className="text-sm text-text-secondary">SKU: {item.product.sku}</p>
          <p className="text-sm text-text-secondary">Low Stock Threshold: {item.lowStockThreshold}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity to Add</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Weekly restock, Emergency restock"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white"
              disabled={isSubmitting || !quantity}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restocking...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { state } = useAdmin();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [filterLowStock]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getInventory<InventoryItem[]>({
        lowStockOnly: filterLowStock,
        activeProductsOnly: true,
        limit: 100
      });

      if (response.success && response.data) {
        setInventory(response.data);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (productId: string, quantity: number, reason?: string) => {
    try {
      const response = await adminApi.restockProduct(productId, quantity, reason);
      
      if (response.success) {
        // Update local inventory state
        setInventory(prev => prev.map(item => 
          item.productId === productId 
            ? { 
                ...item, 
                currentStock: item.currentStock + quantity,
                totalReceived: item.totalReceived + quantity,
                lastRestocked: new Date().toISOString()
              }
            : item
        ));
        
        // Show success message
        console.log(`Successfully restocked ${quantity} units`);
      } else {
        throw new Error(response.error || 'Failed to restock product');
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      throw error;
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
    } else if (item.currentStock <= item.lowStockThreshold) {
      return { text: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertTriangle };
    } else {
      return { text: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100', icon: Package };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Inventory Management</h1>
          <p className="text-text-secondary">Monitor and manage product stock levels</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is the primary location for all stock operations (restocking, adjustments, movements). 
              Product forms only show current stock for reference.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadInventory}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Products</p>
              <p className="text-3xl font-bold text-text-primary">{inventory.length}</p>
            </div>
            <Package className="h-12 w-12 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Low Stock Items</p>
              <p className="text-3xl font-bold text-orange-600">
                {inventory.filter(item => item.currentStock <= item.lowStockThreshold && item.currentStock > 0).length}
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600">
                {inventory.filter(item => item.currentStock === 0).length}
              </p>
            </div>
            <Archive className="h-12 w-12 text-red-600 opacity-20" />
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Stock Value</p>
              <p className="text-3xl font-bold text-text-primary">
                ${inventory.reduce((sum, item) => sum + (item.currentStock * item.product.price), 0).toFixed(0)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Products</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilterLowStock(!filterLowStock)}
              variant={filterLowStock ? "primary" : "outline"}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {filterLowStock ? 'Show All' : 'Low Stock Only'}
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border-default">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Current Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Reserved</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Last Restocked</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;
                
                return (
                  <tr key={item.id} className="border-b border-border-default hover:bg-background/50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-text-primary">{item.product.name}</div>
                        <div className="text-sm text-text-secondary">SKU: {item.product.sku}</div>
                        <div className="text-sm text-text-secondary">{item.product.category}</div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary text-lg">
                          {item.currentStock}
                        </span>
                        <div className="text-sm text-text-secondary">
                          <div>Threshold: {item.lowStockThreshold}</div>
                          <div>Total Sold: {item.totalSold}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="font-medium text-text-primary">{item.reservedStock}</span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="text-sm text-text-secondary">
                        {formatDate(item.lastRestocked)}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowRestockModal(true);
                          }}
                          className="flex items-center gap-1 bg-primary text-white"
                        >
                          <Plus className="h-3 w-3" />
                          Restock
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <History className="h-3 w-3" />
                          History
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInventory.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-text-secondary opacity-50 mb-4" />
          <p className="text-text-secondary">
            {searchTerm ? 'No products found matching your search.' : 'No inventory items found.'}
          </p>
        </div>
      )}

      {/* Restock Modal */}
      <RestockModal
        isOpen={showRestockModal}
        onClose={() => {
          setShowRestockModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onRestock={handleRestock}
      />
    </div>
  );
}