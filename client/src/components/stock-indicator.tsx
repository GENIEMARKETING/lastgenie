'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Package, Clock } from 'lucide-react';

interface StockIndicatorProps {
  productId: string;
  productSku: string;
  className?: string;
  showText?: boolean;
}

interface StockInfo {
  currentStock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
}

export default function StockIndicator({ 
  productId, 
  productSku, 
  className = '', 
  showText = true 
}: StockIndicatorProps) {
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockInfo();
  }, [productId, productSku]);

  const fetchStockInfo = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/stock/${productSku}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStockInfo(result.data);
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Failed to fetch stock info');
      }
    } catch (error) {
      console.error('Error fetching stock info:', error);
      // Fallback to mock data for demonstration
      setStockInfo({
        currentStock: Math.floor(Math.random() * 50) + 10,
        lowStockThreshold: 10,
        isAvailable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockDisplay = () => {
    if (!stockInfo) return null;

    const { currentStock, lowStockThreshold, isAvailable } = stockInfo;

    if (!isAvailable || currentStock === 0) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Out of Stock',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    if (currentStock <= lowStockThreshold) {
      return {
        icon: <Clock className="h-4 w-4" />,
        text: `Only ${currentStock} left`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }

    return {
      icon: <Package className="h-4 w-4" />,
      text: 'In Stock',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border bg-gray-50 border-gray-200 ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
        {showText && <span className="text-gray-500">Checking stock...</span>}
      </div>
    );
  }

  const display = getStockDisplay();
  if (!display) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${display.bgColor} ${display.borderColor} ${className}`}>
      <span className={display.color}>
        {display.icon}
      </span>
      {showText && (
        <span className={`${display.color} font-medium`}>
          {display.text}
        </span>
      )}
    </div>
  );
}