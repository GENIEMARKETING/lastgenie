import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createBlogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().datetime().optional()
});

const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  status: z.enum(['draft', 'published']).optional(),
  publishedAt: z.string().datetime().optional()
});

/**
 * GET /api/blog
 * Get all blog posts (public endpoint)
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    const where: any = {};
    
    // Only show published posts for public access
    if (status === 'published' || !status) {
      where.status = 'published';
    }
    
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;
    const offsetNum = offset ? parseInt(offset as string, 10) : undefined;
    
    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limitNum,
      skip: offsetNum
    });
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts'
    });
  }
});

/**
 * GET /api/blog/:slug
 * Get blog post by slug (public endpoint)
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const post = await prisma.blogPost.findUnique({
      where: { 
        slug,
        status: 'published' // Only show published posts publicly
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post'
    });
  }
});

/**
 * POST /api/blog
 * Create new blog post (admin only)
 */
router.post('/', authenticate, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const validatedData = createBlogPostSchema.parse(req.body);
    
    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: validatedData.slug }
    });
    
    if (existingPost) {
      return res.status(400).json({
        success: false,
        error: 'A blog post with this slug already exists'
      });
    }
    
    const post = await prisma.blogPost.create({
      data: {
        ...validatedData,
        authorId: req.user.id,
        publishedAt: validatedData.status === 'published' 
          ? validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date()
          : null
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create blog post'
    });
  }
});

/**
 * PUT /api/blog/:id
 * Update blog post (admin only)
 */
router.put('/:id', authenticate, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const validatedData = updateBlogPostSchema.parse(req.body);
    
    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }
    
    // Check if slug already exists (if slug is being updated)
    if (validatedData.slug && validatedData.slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug: validatedData.slug }
      });
      
      if (slugExists) {
        return res.status(400).json({
          success: false,
          error: 'A blog post with this slug already exists'
        });
      }
    }
    
    const updateData: any = { ...validatedData };
    
    // Handle publishedAt logic
    if (validatedData.status === 'published' && !existingPost.publishedAt) {
      updateData.publishedAt = validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date();
    } else if (validatedData.status === 'draft') {
      updateData.publishedAt = null;
    }
    
    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update blog post'
    });
  }
});

/**
 * DELETE /api/blog/:id
 * Delete blog post (admin only)
 */
router.delete('/:id', authenticate, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }
    
    await prisma.blogPost.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog post'
    });
  }
});

export default router;