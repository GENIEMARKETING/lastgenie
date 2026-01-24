import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const contentDirectory = path.join(process.cwd(), 'src/content/blog');

// Configure gray-matter to use js-yaml v4 compatible parser
const matterOptions = {
  engines: {
    yaml: {
      parse: (str: string) => {
        // Use yaml.load instead of yaml.safeLoad (removed in js-yaml v4)
        return yaml.load(str) as any;
      },
      stringify: (obj: any) => {
        return yaml.dump(obj);
      },
    },
  },
};

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  pillar: string;
  excerpt: string;
  featuredImage?: string;
  content: string;
}

export interface BlogPostMetadata {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  pillar: string;
  excerpt: string;
  featuredImage?: string;
}

/**
 * Get all blog posts sorted by date (newest first)
 */
export function getAllBlogPosts(): BlogPostMetadata[] {
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(contentDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents, matterOptions);

      return {
        slug,
        title: data.title || '',
        date: data.date || '',
        author: data.author || 'Genie Wellness Team',
        tags: data.tags || [],
        pillar: data.pillar || '',
        excerpt: data.excerpt || '',
        featuredImage: data.featuredImage,
      } as BlogPostMetadata;
    });

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

/**
 * Get all blog posts filtered by pillar
 */
export function getBlogPostsByPillar(pillar: string): BlogPostMetadata[] {
  const allPosts = getAllBlogPosts();
  return allPosts.filter((post) => post.pillar === pillar);
}

/**
 * Get a single blog post by slug
 */
export function getBlogPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(contentDirectory, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents, matterOptions);

  return {
    slug,
    title: data.title || '',
    date: data.date || '',
    author: data.author || 'Genie Wellness Team',
    tags: data.tags || [],
    pillar: data.pillar || '',
    excerpt: data.excerpt || '',
    featuredImage: data.featuredImage,
    content,
  };
}

/**
 * Get all blog post slugs for static generation
 */
export function getAllBlogPostSlugs(): string[] {
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => fileName.replace(/\.mdx$/, ''));
}

/**
 * Get related blog posts (same pillar, excluding current post)
 */
export function getRelatedPosts(currentSlug: string, currentPillar: string, limit: number = 3): BlogPostMetadata[] {
  const allPosts = getAllBlogPosts();
  return allPosts
    .filter((post) => post.slug !== currentSlug && post.pillar === currentPillar)
    .slice(0, limit);
}
