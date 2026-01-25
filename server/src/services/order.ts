import { prisma } from '../lib/prisma';
import { OrderStatus } from '../types/prisma-types';
import { confirmStockSale } from './inventory';
import { sseManager, SSEEvents } from './sse';

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search by order number, user email, or user name
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'totalAmount' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateOrderData {
  status?: OrderStatus;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippingAmount?: number;
  taxAmount?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
}

/**
 * Get all orders with optional filters
 */
export async function getAllOrders(filters: OrderFilters = {}) {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.userId) {
    where.userId = filters.userId;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }
  
  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
      { user: { lastName: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  const orderBy: any = {};
  if (filters.sortBy) {
    orderBy[filters.sortBy] = filters.sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  return await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      shippingAddress: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
              category: true
            }
          }
        }
      },
      subscription: {
        select: {
          id: true,
          status: true,
          interval: true
        }
      },
      affiliateConversion: {
        include: {
          affiliate: {
            select: {
              referralCode: true,
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }
    },
    orderBy,
    take: filters.limit,
    skip: filters.offset
  });
}

/**
 * Get a single order by ID
 */
export async function getOrderById(id: string) {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          stripeCustomerId: true
        }
      },
      shippingAddress: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
              images: true,
              category: true,
              packageSize: true
            }
          }
        }
      },
      subscription: {
        select: {
          id: true,
          status: true,
          interval: true,
          nextBillingDate: true
        }
      },
      affiliateConversion: {
        include: {
          affiliate: {
            select: {
              referralCode: true,
              commissionRate: true,
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }
    }
  });
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string) {
  return await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      shippingAddress: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
              category: true
            }
          }
        }
      }
    }
  });
}

/**
 * Update order status and details
 */
export async function updateOrder(id: string, data: UpdateOrderData, adminUserId?: string) {
  return await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // If status is changing to 'delivered', confirm stock sale
    if (data.status === 'delivered' && existingOrder.status !== 'delivered') {
      const items = existingOrder.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      await confirmStockSale(existingOrder.id, items);
    }

    // Update the order
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };
    // Ensure status is properly typed if present
    if (updateData.status) {
      updateData.status = updateData.status as any;
    }
    const updatedOrder = await tx.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        shippingAddress: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
                category: true
              }
            }
          }
        }
      }
    });

    // Log the status change if admin user is provided
    if (adminUserId && data.status) {
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'order_status_update',
          entity: 'order',
          entityId: id,
          oldValues: { status: existingOrder.status },
          newValues: { status: data.status },
          metadata: {
            orderNumber: existingOrder.orderNumber,
            trackingNumber: data.trackingNumber,
            shippingCarrier: data.shippingCarrier
          }
        }
      });

      // Emit SSE event for order status update
      sseManager.broadcastToAdmins(SSEEvents.orderStatusUpdate(
        id,
        existingOrder.orderNumber,
        existingOrder.status,
        data.status
      ));
    }

    return updatedOrder;
  });
}

/**
 * Bulk update order statuses
 */
export async function bulkUpdateOrderStatus(
  orderIds: string[], 
  status: OrderStatus, 
  adminUserId: string,
  trackingInfo?: { carrier?: string; trackingNumber?: string }
) {
  const results: any[] = [];

  for (const orderId of orderIds) {
    try {
      const updateData: UpdateOrderData = { status };
      if (trackingInfo?.carrier) updateData.shippingCarrier = trackingInfo.carrier;
      if (trackingInfo?.trackingNumber) updateData.trackingNumber = trackingInfo.trackingNumber;

      const order = await updateOrder(orderId, updateData, adminUserId);
      results.push({ orderId, success: true, data: order });
    } catch (error) {
      results.push({
        orderId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Get order statistics
 */
export async function getOrderStats(dateFrom?: Date, dateTo?: Date): Promise<OrderStats> {
  const dateFilter: any = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {};
    if (dateFrom) dateFilter.createdAt.gte = dateFrom;
    if (dateTo) dateFilter.createdAt.lte = dateTo;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalOrders,
    statusCounts,
    revenueData,
    todayOrders,
    todayRevenueData
  ] = await Promise.all([
    prisma.order.count({ where: dateFilter }),
    prisma.order.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { status: true }
    }),
    prisma.order.aggregate({
      where: dateFilter,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true }
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: { totalAmount: true }
    })
  ]);

  const statusCountMap = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return {
    totalOrders,
    pendingOrders: statusCountMap.pending || 0,
    processingOrders: statusCountMap.processing || 0,
    shippedOrders: statusCountMap.shipped || 0,
    deliveredOrders: statusCountMap.delivered || 0,
    cancelledOrders: statusCountMap.cancelled || 0,
    refundedOrders: statusCountMap.refunded || 0,
    totalRevenue: revenueData._sum.totalAmount || 0,
    averageOrderValue: revenueData._avg.totalAmount || 0,
    todayOrders,
    todayRevenue: todayRevenueData._sum.totalAmount || 0
  };
}

/**
 * Get recent orders
 */
export async function getRecentOrders(limit: number = 10) {
  return await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          }
        }
      }
    }
  });
}

/**
 * Get orders that need attention (pending, issues, etc.)
 */
export async function getOrdersNeedingAttention() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  return await prisma.order.findMany({
    where: {
      OR: [
        // Orders pending for more than 2 days
        {
          status: 'pending',
          createdAt: { lt: twoDaysAgo }
        },
        // Paid orders not yet shipped after 1 day
        {
          status: 'paid',
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Get revenue data for charts
 */
export async function getRevenueData(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { in: ['paid', 'shipped', 'delivered'] }
    },
    select: {
      createdAt: true,
      totalAmount: true
    }
  });

  // Group by date
  const revenueByDate: Record<string, number> = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    revenueByDate[dateStr] = 0;
  }

  orders.forEach(order => {
    const dateStr = order.createdAt.toISOString().split('T')[0];
    if (revenueByDate.hasOwnProperty(dateStr)) {
      revenueByDate[dateStr] += order.totalAmount;
    }
  });

  return Object.entries(revenueByDate).map(([date, revenue]) => ({
    date,
    revenue
  }));
}

/**
 * Cancel an order
 */
export async function cancelOrder(id: string, reason: string, adminUserId?: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'delivered') {
      throw new Error('Cannot cancel a delivered order');
    }

    if (order.status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    // If order was paid, we might need to process refund
    // This would integrate with Stripe or payment processor

    // Log the cancellation
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'order_cancelled',
        entity: 'order',
        entityId: id,
        oldValues: { status: order.status },
        newValues: { status: 'cancelled' },
        metadata: {
          reason,
          orderNumber: order.orderNumber
        }
      }
    });

    return updatedOrder;
  });
}

/**
 * Get orders by user
 */
export async function getOrdersByUser(userId: string, limit?: number) {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
              category: true
            }
          }
        }
      },
      shippingAddress: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Emit new order event for SSE
 */
export function emitNewOrderEvent(orderId: string, orderNumber: string, totalAmount: number, customerEmail: string) {
  sseManager.broadcastToAdmins(SSEEvents.newOrder(
    orderId,
    orderNumber,
    totalAmount,
    customerEmail
  ));
}