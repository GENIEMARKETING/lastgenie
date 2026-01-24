'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug, BlogPost } from '@/lib/api/blog';
import { BlogPostHeader } from '@/components/blog/blog-post-header';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { ArrowLeft } from 'lucide-react';

interface BlogPostClientProps {
  slug: string;
}

export default function BlogPostClient({ slug }: BlogPostClientProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchPost() {
      try {
        setLoading(true);
        setError(null);
        const response = await getBlogPostBySlug(slug);
        
        if (response.success && response.data) {
          setPost(response.data);
        } else {
          setError(response.error || 'Post not found');
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link 
              href="/blog" 
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to Blog Link */}
          <Link 
            href="/blog" 
            className="inline-flex items-center text-primary hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {/* Blog Post Header */}
          <BlogPostHeader post={post} />

          {/* Blog Post Content */}
          <article className="prose prose-lg max-w-none mt-8">
            <MarkdownContent content={post.content} />
          </article>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-border-default">
            <Link 
              href="/blog" 
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}