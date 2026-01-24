'use client';

import { useState, useMemo } from 'react';
import { BlogCard } from '@/components/blog/blog-card';
import { PillarBadge } from '@/components/blog/pillar-badge';
import type { BlogPost } from '@/lib/api/blog';

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  return (
    <>
      {/* Blog Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg">No blog posts found.</p>
        </div>
      )}
    </>
  );
}
