import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, ArrowRight, Clock } from 'lucide-react';
import { CategoryBadge } from './pillar-badge';
import { TagList } from './tag-list';
import { getCategoryFromSlug, getCategoryStyle, calculateReadTime, formatPublishDate } from '@/lib/blog-utils';
import type { BlogPost } from '@/lib/api/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const category = getCategoryFromSlug(post.slug);
  const categoryStyle = getCategoryStyle(category);
  const readTime = calculateReadTime(post.content);
  const publishDate = formatPublishDate(post.publishedAt || post.createdAt);

  return (
    <div className="group bg-surface border border-border-default rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Featured Image with Category Gradient */}
      <div className={`w-full h-48 bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center relative`}>
        <span className="text-4xl">✨</span>
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <CategoryBadge category={category} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Meta Info - Date and Read Time */}
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{publishDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{readTime} min read</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-text-secondary line-clamp-2">{post.excerpt || 'No excerpt available'}</p>

        {/* Read Article Button */}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors group/link"
        >
          Read Article
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
