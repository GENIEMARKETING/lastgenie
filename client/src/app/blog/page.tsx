'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { getBlogPosts, BlogPost } from '@/lib/api/blog';
import { BlogList } from './blog-list';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const response = await getBlogPosts();
        
        if (response.success && response.data) {
          setPosts(response.data);
        } else {
          setError(response.error || 'Failed to load blog posts');
        }
      } catch (err) {
        setError('Failed to load blog posts');
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-medium text-lg mb-2">The Journal</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Genie Blog
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Expert advice, wellness tips, and guides to help you explore your pleasure journey.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-medium text-lg mb-2">The Journal</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Genie Blog
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Expert advice, wellness tips, and guides to help you explore your pleasure journey.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-medium text-lg mb-2">The Journal</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Genie Blog
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Expert advice, wellness tips, and guides to help you explore your pleasure journey.
          </p>
        </div>

        <BlogList posts={posts} />
      </div>
    </div>
  );
}
