import { BlogCategory, getCategoryStyle } from '@/lib/blog-utils';

interface CategoryBadgeProps {
  category: BlogCategory;
  className?: string;
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const categoryInfo = getCategoryStyle(category);

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.color} ${className}`}
    >
      {categoryInfo.label}
    </span>
  );
}

// Keep the old PillarBadge for backward compatibility
interface PillarBadgeProps {
  pillar: string;
  className?: string;
}

const pillarColors: Record<string, { bg: string; text: string }> = {
  'Education & Empowerment': {
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  'Product Transparency & Science': {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
  },
  'Community & Lifestyle': {
    bg: 'bg-accent/10',
    text: 'text-accent',
  },
};

export function PillarBadge({ pillar, className = '' }: PillarBadgeProps) {
  const colors = pillarColors[pillar] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text} ${className}`}
    >
      {pillar}
    </span>
  );
}
