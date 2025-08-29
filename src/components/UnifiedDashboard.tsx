'use client';

import { useState, useEffect } from 'react';
import { PostCard } from './PostCard';
import { FeedSelector } from './FeedSelector';
import { Post } from '@/types';

interface FeedStats {
  hackerNews: number;
  reddit: number; 
  twitter: number;
}

export function UnifiedDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>(['hackernews', 'reddit', 'twitter']);
  const [feedStats, setFeedStats] = useState<FeedStats>({ hackerNews: 0, reddit: 0, twitter: 0 });

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
      console.log(`🌟 Successfully loaded ${data.posts?.length || 0} posts`);
      
    } catch (error) {
      console.error('🌟 Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const filteredPosts = posts.filter(post => 
    selectedFeeds.includes(post.source)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">AIspresso Dashboard</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading feeds...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">AIspresso Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">Error loading feeds</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
            <button 
              onClick={fetchAllPosts}
              className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AIspresso Dashboard</h1>
            <div className="text-sm text-gray-600 mt-2">
              Showing {filteredPosts.length} of {posts.length} posts
              {feedStats.hackerNews > 0 && ` • ${feedStats.hackerNews} HN`}
              {feedStats.reddit > 0 && ` • ${feedStats.reddit} Reddit`}
              {feedStats.twitter > 0 && ` • ${feedStats.twitter} Twitter`}
            </div>
          </div>
          <button
            onClick={fetchAllPosts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <FeedSelector 
          selectedFeeds={selectedFeeds}
          onFeedToggle={(feed) => {
            setSelectedFeeds(prev => 
              prev.includes(feed) 
                ? prev.filter(f => f !== feed)
                : [...prev, feed]
            );
          }}
        />

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No posts found</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}