/**
 * Blog utility functions for content processing and categorization
 */

/**
 * Calculate estimated read time based on content length
 * Average reading speed: 200-250 words per minute
 * @param content - The markdown content string
 * @returns Estimated read time in minutes
 */
export function calculateReadTime(content: string): number {
  if (!content) return 1;
  
  // Remove markdown syntax and count words
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  const readTime = Math.ceil(wordCount / 225); // 225 words per minute average
  
  return Math.max(1, readTime); // Minimum 1 minute
}

/**
 * Blog post categories with their styling
 */
export const BLOG_CATEGORIES = {
  wellness: {
    label: 'Wellness',
    color: 'bg-green-100 text-green-800',
    gradient: 'from-green-400/20 to-emerald-400/20'
  },
  education: {
    label: 'Education', 
    color: 'bg-blue-100 text-blue-800',
    gradient: 'from-blue-400/20 to-indigo-400/20'
  },
  guides: {
    label: 'Guides',
    color: 'bg-purple-100 text-purple-800', 
    gradient: 'from-purple-400/20 to-pink-400/20'
  }
} as const;

export type BlogCategory = keyof typeof BLOG_CATEGORIES;

/**
 * Map blog post slug to category
 * @param slug - The blog post slug
 * @returns The appropriate category
 */
export function getCategoryFromSlug(slug: string): BlogCategory {
  const categoryMap: Record<string, BlogCategory> = {
    'boost-intimacy-naturally': 'wellness',
    'the-science-behind-genie': 'education', 
    'real-stories-real-connections': 'guides'
  };

  return categoryMap[slug] || 'wellness';
}

/**
 * Get category styling information
 * @param category - The blog category
 * @returns Category styling object
 */
export function getCategoryStyle(category: BlogCategory) {
  return BLOG_CATEGORIES[category];
}

/**
 * Format publication date for display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatPublishDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
}