import type { Metadata } from 'next';
import TopicFeed from '@/components/social/TopicFeed';

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ');
  return {
    title: `#${name} · TeachLink`,
    description: `Explore posts and discussions about ${name} on TeachLink.`,
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <TopicFeed slug={slug} />
      </div>
    </main>
  );
}
