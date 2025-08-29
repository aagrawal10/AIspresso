'use client';

import { useState, useEffect } from 'react';
import { PostCard } from './PostCard';
import { Post } from '@/types';
import { RefreshCw } from 'lucide-react';

interface FeedStats {
  hackerNews: number;
  reddit: number; 
  twitter: number;
}

export function UnifiedDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedStats, setFeedStats] = useState<FeedStats>({ hackerNews: 0, reddit: 0, twitter: 0 });
  const [caughtUp, setCaughtUp] = useState(false);
  const [sourcesWithNew, setSourcesWithNew] = useState<string[]>([]);
  const [showingRecentPosts, setShowingRecentPosts] = useState(false);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌟 Fetching all posts from unified API...');
      const response = await fetch('/api/feeds/all?t=' + Date.now());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🌟 Received data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPosts(data.posts || []);
      setFeedStats(data.sources || { hackerNews: 0, reddit: 0, twitter: 0 });
      setCaughtUp(!data.hasNewContent);
      setSourcesWithNew(data.sourcesWithNew || []);
      setShowingRecentPosts(data.showingRecentPosts || false);
      
      console.log(`🌟 Successfully loaded ${data.totalNew || 0} new posts (${data.totalFetched || 0} total fetched)`);
      console.log(`🌟 Sources with new content: ${data.sourcesWithNew?.join(', ') || 'none'}`);
      
    } catch (error) {
      console.error('🌟 Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch posts');
      setCaughtUp(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'hackernews': return '🟠';
      case 'reddit': return '🔴';  
      case 'twitter': return '🐦';
      default: return '📰';
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case 'hackernews': return 'Hacker News';
      case 'reddit': return 'Reddit';
      case 'twitter': return 'Twitter';
      default: return source;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">AIspresso Dashboard</h1>
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin" size={20} />
              <div className="text-lg text-gray-600">Loading feeds...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">AIspresso Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-800 font-medium mb-2">Error loading feeds</div>
            <div className="text-red-600 text-sm mb-4">{error}</div>
            <button 
              onClick={fetchAllPosts}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (caughtUp && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AIspresso Dashboard</h1>
            <button
              onClick={fetchAllPosts}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">You're all caught up!</h2>
            <p className="text-gray-600 mb-6">No new posts from Hacker News, Reddit, or Twitter.</p>
            <button
              onClick={fetchAllPosts}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Check for new posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AIspresso Dashboard</h1>
            <div className="text-sm text-gray-600 mt-2">
              {showingRecentPosts ? (
                <>
                  <div className="text-green-600 font-medium mb-1">✅ You're all caught up!</div>
                  <div>Showing {posts.length} recent posts</div>
                </>
              ) : (
                <>
                  {posts.length} new posts
                  {sourcesWithNew.length > 0 && (
                    <span className="ml-2">
                      from {sourcesWithNew.map(source => getSourceIcon(source) + ' ' + getSourceName(source)).join(', ')}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <button
            onClick={fetchAllPosts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}