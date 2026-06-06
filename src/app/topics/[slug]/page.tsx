import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, Hash } from 'lucide-react';
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

// Static sidebar data — replace with API calls when available
const RELATED_TOPICS = [
  { slug: 'web3', name: 'web3' },
  { slug: 'blockchain', name: 'blockchain' },
  { slug: 'defi', name: 'defi' },
  { slug: 'starknet', name: 'starknet' },
  { slug: 'cairo', name: 'cairo' },
];

const TRENDING_POSTS = [
  { id: '1', title: 'Getting started with Starknet', author: 'alice.stark' },
  { id: '2', title: 'Cairo 1.0 deep dive', author: 'bob.dev' },
  { id: '3', title: 'DeFi protocols explained', author: 'carol.eth' },
];

function Sidebar({ currentSlug }: { currentSlug: string }) {
  const related = RELATED_TOPICS.filter((t) => t.slug !== currentSlug);

  return (
    <aside className="space-y-4" aria-label="Sidebar">
      {/* Related topics */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
          <Hash className="w-4 h-4 text-blue-500" aria-hidden="true" />
          Related Topics
        </h2>
        <ul className="space-y-1">
          {related.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={`/topics/${topic.slug}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="text-gray-400 dark:text-gray-500">#</span>
                {topic.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Trending posts */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-orange-500" aria-hidden="true" />
          Trending
        </h2>
        <ol className="space-y-3">
          {TRENDING_POSTS.map((post, i) => (
            <li key={post.id} className="flex gap-2">
              <span
                className="text-xs font-bold text-gray-400 dark:text-gray-600 w-4 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/post/${post.id}`}
                  className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">by {post.author}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          {/* Main feed */}
          <TopicFeed slug={slug} />

          {/* Sidebar */}
          <div className="lg:sticky lg:top-8">
            <Sidebar currentSlug={slug} />
          </div>
        </div>
      </div>
    </main>
  );
}
