'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import adminApi from '@/lib/admin-api';
import { 
  Package, 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Boxes,
  ShoppingCart,
  Image as ImageIcon,
  Tag,
  Archive,
  Star
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  packageSize: string;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
  metaTitle?: string;
  metaDescription?: string;
  inventory?: {
    currentStock: number;
    lowStockThreshold: number;
  };
  _count?: {
    orderItems: number;
  };
  averageRating?: number;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalValue: number;
  topSellingProduct: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  sku: string;
  category: string;
  packageSize: string;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  inventory?: {
    currentStock: number;
    lowStockThreshold: number;
  };
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
  title: string;
  initialData?: Product;
}

function ProductModal({ isOpen, onClose, onSave, title, initialData }: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    originalPrice: initialData?.originalPrice || undefined,
    sku: initialData?.sku || '',
    category: initialData?.category || 'male',
    packageSize: initialData?.packageSize || 'single',
    isActive: initialData?.isActive ?? true,
    isFeatured: initialData?.isFeatured || false,
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    inventory: {
      currentStock: initialData?.inventory?.currentStock || 0,
      lowStockThreshold: initialData?.inventory?.lowStockThreshold || 10
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border-default rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-text-primary mb-6">{title}</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="originalPrice">Original Price ($)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice || ''}
                onChange={(e) => handleChange('originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full rounded-md border border-border-default px-3 py-2 bg-surface"
                required
              >
                <option value="male">Male Enhancement</option>
                <option value="female">Female Enhancement</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="packageSize">Package Size</Label>
              <select
                id="packageSize"
                value={formData.packageSize}
                onChange={(e) => handleChange('packageSize', e.target.value)}
                className="w-full rounded-md border border-border-default px-3 py-2 bg-surface"
                required
              >
                <option value="single">Single</option>
                <option value="twelve_pack">12-Pack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle || ''}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                placeholder="SEO title for search engines"
              />
            </div>
            
            <div>
              <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
              <Input
                id="metaDescription"
                value={formData.metaDescription || ''}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                placeholder="SEO description for search engines"
              />
            </div>
          </div>

          {/* Inventory Information (Read-Only) */}
          <div className="border-t border-border-default pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-text-primary">Inventory Information</h4>
              <Link
                href={`/admin/inventory${initialData ? `?product=${initialData.id}` : ''}`}
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                Manage Stock →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentStock">Current Stock (Read-Only)</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.inventory?.currentStock || 0}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-text-secondary mt-1">
                  To update stock, use the <Link href="/admin/inventory" className="text-primary underline">Inventory Management</Link> page
                </p>
              </div>
              
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.inventory?.lowStockThreshold || 10}
                  onChange={(e) => handleChange('inventory', {
                    ...formData.inventory,
                    lowStockThreshold: parseInt(e.target.value) || 10
                  })}
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  Alert threshold for low stock notifications
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Active Product</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleChange('isFeatured', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isFeatured">Featured Product</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Product'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts<Product[]>({
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        limit: 100
      });

      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Failed to fetch products');
      }

      // Fetch stats
      const statsResponse = await adminApi.getProducts<Product[]>({ limit: 1000 }); // Get all for stats
      if (statsResponse.success && statsResponse.data) {
        const allProducts = statsResponse.data;
        setStats({
          totalProducts: allProducts.length,
          activeProducts: allProducts.filter(p => p.isActive).length,
          lowStockProducts: allProducts.filter(p => p.inventory && p.inventory.currentStock <= p.inventory.lowStockThreshold).length,
          totalValue: allProducts.reduce((sum, p) => sum + (p.inventory?.currentStock || 0) * p.price, 0),
          topSellingProduct: allProducts.sort((a, b) => (b._count?.orderItems || 0) - (a._count?.orderItems || 0))[0]?.name || 'N/A'
        });
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (data: ProductFormData) => {
    const response = await adminApi.createProduct({
      ...data,
      initialStock: 0, // Always start with 0 stock
      lowStockThreshold: data.inventory?.lowStockThreshold || 10
    });

    if (response.success) {
      await fetchProducts(); // Refresh the list
      // Note: Stock should be added via the Inventory Management page
    } else {
      throw new Error(response.error || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (id: string, data: ProductFormData) => {
    try {
      console.log('Updating product:', id, data); // Debug log
      
      const response = await adminApi.updateProduct(id, data);

      if (response.success) {
        // Update inventory settings if provided
        if (data.inventory) {
          try {
            await adminApi.updateInventorySettings(id, {
              lowStockThreshold: data.inventory.lowStockThreshold
            });
          } catch (error) {
            console.error('Failed to update inventory settings:', error);
            // Don't fail the whole operation for inventory settings
          }
        }
        
        await fetchProducts(); // Refresh the list
        console.log('Product updated successfully');
      } else {
        console.error('Product update failed:', response.error);
        throw new Error(response.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Product update error:', error);
      // Re-throw to be handled by the modal
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product?')) {
      return;
    }

    try {
      const response = await adminApi.deleteProduct(id);
      if (response.success) {
        await fetchProducts(); // Refresh the list
      } else {
        alert(response.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'discontinued':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockStatus = (product: Product) => {
    const stock = product.inventory?.currentStock || 0;
    const threshold = product.inventory?.lowStockThreshold || 10;
    
    if (stock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', icon: AlertTriangle };
    } else if (stock <= threshold) {
      return { text: 'Low Stock', color: 'text-orange-600', icon: AlertTriangle };
    } else {
      return { text: 'In Stock', color: 'text-green-600', icon: Package };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && products.length === 0) {
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
          <h1 className="text-3xl font-bold text-text-primary">Product Management</h1>
          <p className="text-text-secondary">Manage your product catalog and inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchProducts}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-white"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Products</p>
                <p className="text-3xl font-bold text-text-primary">{stats.totalProducts}</p>
                <p className="text-sm text-green-600">{stats.activeProducts} active</p>
              </div>
              <Package className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Inventory Value</p>
                <p className="text-3xl font-bold text-text-primary">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-text-secondary">total value</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Low Stock Items</p>
                <p className="text-3xl font-bold text-orange-600">{stats.lowStockProducts}</p>
                <p className="text-sm text-text-secondary">need attention</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Top Seller</p>
                <p className="text-lg font-bold text-text-primary">{stats.topSellingProduct}</p>
                <p className="text-sm text-green-600">best performing</p>
              </div>
              <Star className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>
        </div>
      )}

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

          <div>
            <Label htmlFor="category-filter">Category</Label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
            >
              <option value="all">All Categories</option>
              <option value="Male Enhancement">Male Enhancement</option>
              <option value="Female Enhancement">Female Enhancement</option>
              <option value="Bundle">Bundle</option>
            </select>
          </div>

          <div>
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border-default">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">SKU</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Sales</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                const StockIcon = stockStatus.icon;
                
                return (
                  <tr key={product.id} className="border-b border-border-default hover:bg-background/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary flex items-center gap-2">
                            {product.name}
                            {product.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          </div>
                          <div className="text-sm text-text-secondary">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-text-primary">{product.sku}</span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-semibold text-text-primary">{formatCurrency(product.price)}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-sm text-text-secondary line-through">
                            {formatCurrency(product.originalPrice)}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <StockIcon className={`h-4 w-4 ${stockStatus.color}`} />
                        <div>
                          <span className="font-medium text-text-primary">{product.inventory?.currentStock || 0}</span>
                          <div className={`text-sm ${stockStatus.color}`}>{stockStatus.text}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(product.isActive ? 'active' : 'inactive')}`}>
                        {product.isActive ? 'active' : 'inactive'}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="font-medium text-text-primary">{product._count?.orderItems || 0}</span>
                      <div className="text-sm text-text-secondary">orders</div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowEditModal(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Navigate to inventory management for this product
                            window.location.href = `/admin/inventory?product=${product.id}`;
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <Boxes className="h-3 w-3" />
                          Stock
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
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

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateProduct}
          title="Add New Product"
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <ProductModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSave={(data) => handleUpdateProduct(selectedProduct.id, data)}
          title={`Edit Product: ${selectedProduct.name}`}
          initialData={selectedProduct}
        />
      )}
    </div>
  );
}