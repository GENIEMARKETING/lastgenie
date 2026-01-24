import BlogPostClient from './blog-post-client';

// Generate static params for blog posts at build time
export async function generateStaticParams() {
  try {
    // For static export, return a placeholder since blog posts are dynamic
    // This allows the route to exist but will be handled client-side
    return [
      { slug: 'placeholder' }
    ];
  } catch (error) {
    console.error('Error generating static params for blog:', error);
    return [{ slug: 'placeholder' }];
  }
}


interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  
  return <BlogPostClient slug={resolvedParams.slug} />;
}
