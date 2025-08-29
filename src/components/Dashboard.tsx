'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post, FeedConfig, PostSource } from '@/types';
import { FeedFetcher } from '@/lib/FeedFetcher';
import { FeedMerger } from '@/lib/FeedMerger';
import { PostCard } from './PostCard';
import { LoadingSpinner } from './LoadingSpinner';
import { CaughtUpMessage } from './CaughtUpMessage';
import { RefreshCw, Settings, CheckCircle } from 'lucide-react';

export function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCaughtUp, setAllCaughtUp] = useState(false);
  const [showEmbeds, setShowEmbeds] = useState(true);

  const defaultConfigs: FeedConfig[] = [
    {
      source: 'hackernews',
      enabled: true,
      config: {},
    },
    // Reddit and Twitter will be enabled when API keys are configured
    {
      source: 'reddit',
      enabled: false,
      config: { subreddits: [] },
    },
    {
      source: 'twitter',
      enabled: false,
      config: { twitterLists: [] },
    },
  ];

  const [feedConfigs, setFeedConfigs] = useState<FeedConfig[]>(defaultConfigs);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allPosts = await FeedFetcher.fetchFromAllSources(feedConfigs);
      const mergedPosts = FeedMerger.mergePosts(allPosts);
      const { newPosts, allCaughtUp: caughtUp } = FeedMerger.filterNewPosts(mergedPosts);
      
      setPosts(newPosts);
      setAllCaughtUp(caughtUp);
      
      if (newPosts.length === 0 && !caughtUp) {
        setError('No new posts found. Try refreshing or check your API configuration.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching posts');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [feedConfigs]);

  const markAllAsSeen = useCallback(() => {
    if (posts.length > 0) {
      FeedMerger.markPostsAsSeen(posts);
      setPosts([]);
      setAllCaughtUp(true);
    }
  }, [posts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const enabledSources = feedConfigs.filter(config => config.enabled);
  const stats = FeedMerger.getSourceStats(posts);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AIspresso</h1>
              <p className="text-sm text-gray-600">
                Personal content dashboard • {enabledSources.length} sources enabled
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPosts}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {posts.length > 0 && (
                <button
                  onClick={markAllAsSeen}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <CheckCircle size={16} />
                  Mark All Seen
                </button>
              )}

              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings size={20} />
              </button>
            </div>
          </div>

          {Object.keys(stats).length > 0 && (
            <div className="mt-3 flex gap-4 text-sm">
              {Object.entries(stats).map(([source, stat]) => (
                <span key={source} className="text-gray-600">
                  {source}: {stat.count} new
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {!loading && allCaughtUp && (
          <CaughtUpMessage onRefresh={fetchPosts} />
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {posts.length} new posts
              </h2>
              
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showEmbeds}
                  onChange={(e) => setShowEmbeds(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show embeds
              </label>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  showEmbed={showEmbeds}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}