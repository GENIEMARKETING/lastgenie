'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBlogPosts, type BlogPost } from '@/lib/api/blog';

interface BlogSectionProps {
  className?: string;
}

export function BlogSection({ className }: BlogSectionProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBlogPosts({ limit: 2 });
      
      if (response.success && response.data) {
        setPosts(response.data);
      } else {
        setError(response.error || 'Failed to fetch blog posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <section className={`py-20 bg-white ${className || ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              The Journal
            </h2>
            <p className="text-muted-foreground">
              Unable to load blog posts at this time.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-20 bg-white ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-display font-bold text-foreground">
            The Journal
          </h2>
          <Link href="/blog" className="hidden md:block">
            <Button variant="link" className="text-primary">
              Read all articles
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-2xl overflow-hidden bg-white animate-pulse"
              >
                <div className="h-48 md:h-full bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-2xl overflow-hidden hover:shadow-lg transition-all bg-white hover:border-primary/20"
              >
                <div className="h-48 md:h-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <span className="text-4xl">✨</span>
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                    Wellness
                  </span>
                  <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors text-foreground line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    Read Now{' '}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No blog posts available at this time.
            </p>
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link href="/blog">
            <Button variant="outline">
              Read all articles
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}