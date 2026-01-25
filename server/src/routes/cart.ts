import express from 'express';
import { z } from 'zod';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Helper function to get or create cart for user
async function getOrCreateCart(userId: string): Promise<string> {
  let cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart.id;
}

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string(), // This will be the product SKU
  quantity: z.number().min(1),
  isSubscription: z.boolean().optional().default(false),
});

const updateCartItemSchema = z.object({
  quantity: z.number().min(1),
});

/**
 * GET /api/cart
 * Get user's cart (authenticated only)
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    const cartItems = cart?.items.map(item => ({
      id: item.id,
      productId: item.product.sku,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.imageUrl || '',
      isSubscription: item.isSubscription,
    })) || [];

    res.json({
      success: true,
      data: {
        items: cartItems,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart',
    });
  }
});

/**
 * POST /api/cart
 * Add item to cart
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to add items to your cart. Please log in and try again.',
        details: {
          action: 'login_required',
          redirectTo: '/login'
        }
      });
    }

    const validatedData = addToCartSchema.parse(req.body);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { sku: validatedData.productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with SKU "${validatedData.productId}" does not exist.`,
      });
    }

    // Get or create cart
    const cartId = await getOrCreateCart(req.user.id);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: product.id,
        isSubscription: validatedData.isSubscription,
      },
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + validatedData.quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              imageUrl: true,
            },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId,
          productId: product.id,
          quantity: validatedData.quantity,
          isSubscription: validatedData.isSubscription,
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              imageUrl: true,
            },
          },
        },
      });
    }

    const responseItem = {
      id: cartItem.id,
      productId: cartItem.product.sku,
      name: cartItem.product.name,
      price: cartItem.product.price,
      quantity: cartItem.quantity,
      image: cartItem.product.imageUrl || '',
      isSubscription: cartItem.isSubscription,
    };

    res.json({
      success: true,
      data: {
        item: responseItem,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
    }

    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
    });
  }
});

/**
 * PUT /api/cart/:itemId
 * Update cart item quantity
 */
router.put('/:itemId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { itemId } = req.params;
    const validatedData = updateCartItemSchema.parse(req.body);

    // Verify the cart item belongs to the user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId as string,
        cart: {
          userId: req.user.id,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
      });
    }

    // Update the cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId as string },
      data: { quantity: validatedData.quantity },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    const responseItem = {
      id: updatedItem.id,
      productId: (updatedItem as any).product?.sku || '',
      name: (updatedItem as any).product?.name || '',
      price: (updatedItem as any).product?.price || 0,
      quantity: updatedItem.quantity,
      image: (updatedItem as any).product?.imageUrl || '',
      isSubscription: updatedItem.isSubscription,
    };

    res.json({
      success: true,
      data: {
        item: responseItem,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
    }

    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart item',
    });
  }
});

/**
 * DELETE /api/cart/:itemId
 * Remove item from cart
 */
router.delete('/:itemId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { itemId } = req.params;

    // Verify the cart item belongs to the user before deleting
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId as string,
        cart: {
          userId: req.user.id,
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
      });
    }

    await prisma.cartItem.delete({
      where: { id: itemId as string },
    });

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart',
    });
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Delete all cart items for the user
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: req.user.id,
        },
      },
    });

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
    });
  }
});

export default router;
