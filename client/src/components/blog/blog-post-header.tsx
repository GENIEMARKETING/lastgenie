import { Calendar, User } from 'lucide-react';
import type { BlogPost } from '@/lib/api/blog';

interface BlogPostHeaderProps {
  post: BlogPost;
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  return (
    <div className="space-y-6 mb-12">
      {/* Title */}
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary">
        {post.title}
      </h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-6 text-text-secondary">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span className="font-medium">{post.author.firstName} {post.author.lastName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-xl text-text-secondary leading-relaxed">{post.excerpt}</p>
      )}
    </div>
  );
}
