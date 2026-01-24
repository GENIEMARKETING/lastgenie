'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug, BlogPost } from '@/lib/api/blog';
import { BlogPostHeader } from '@/components/blog/blog-post-header';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { ArrowLeft } from 'lucide-react';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    async function getSlug() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }
    getSlug();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function fetchPost() {
      try {
        setLoading(true);
        const response = await getBlogPostBySlug(slug);
        
        if (response.success && response.data) {
          setPost(response.data);
        } else {
          setError(response.error || 'Post not found');
        }
      } catch (err) {
        setError('Failed to load blog post');
        console.error('Error fetching blog post:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    author: {
      '@type': 'Person',
      name: `${post.author.firstName} ${post.author.lastName}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Genie',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lastgenie.com/images/logo.png',
      },
    },
    datePublished: post.publishedAt || post.createdAt,
    description: post.excerpt || post.title,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-text-secondary mb-8">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-primary">Blog</Link>
            <span>/</span>
            <span className="text-text-primary">{post.title}</span>
          </nav>

          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Blog Post Header */}
          <BlogPostHeader post={post} />

          {/* Blog Post Content */}
          <article className="prose prose-lg max-w-none mb-16">
            <div className="blog-content">
              <MarkdownContent content={post.content} />
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
