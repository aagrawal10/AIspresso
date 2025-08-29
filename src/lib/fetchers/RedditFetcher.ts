import { Post, FeedConfig, FeedFetcherInterface } from '@/types';

interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
  thumbnail?: string;
  is_video?: boolean;
  is_self?: boolean;
  selftext?: string;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export class RedditFetcher implements FeedFetcherInterface {
  private static readonly BASE_URL = 'https://www.reddit.com';

  getSourceName() {
    return 'reddit' as const;
  }

  async fetchPosts(config: FeedConfig): Promise<Post[]> {
    try {
      console.log('🔴 RedditFetcher: Making request to /api/feeds/reddit');
      const response = await fetch('/api/feeds/reddit?t=' + Date.now());
      
      if (!response.ok) {
        console.error('🔴 RedditFetcher: API route error:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('🔴 RedditFetcher: Received response:', data);
      
      if (data.error) {
        console.error('🔴 RedditFetcher: API error:', data.error);
        return [];
      }
      
      console.log(`🔴 RedditFetcher: Successfully fetched ${data.posts?.length || 0} posts`);
      return data.posts || [];
    } catch (error) {
      console.error('🔴 RedditFetcher: Error calling API route:', error);
      return [];
    }
  }

  private async getAccessToken(): Promise<string | null> {
    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET;
    const username = process.env.NEXT_PUBLIC_REDDIT_USERNAME;
    const password = process.env.NEXT_PUBLIC_REDDIT_PASSWORD;

    console.log('🔴 Reddit API: Getting access token');
    console.log('🔴 Reddit API: Client ID present:', !!clientId);
    console.log('🔴 Reddit API: Client Secret present:', !!clientSecret);
    console.log('🔴 Reddit API: Username present:', !!username);
    console.log('🔴 Reddit API: Password present:', !!password);

    if (!clientId || !clientSecret || !username || !password) {
      console.error('🔴 Missing Reddit API credentials');
      return null;
    }

    try {
      console.log('🔴 Reddit API: Making token request to /api/v1/access_token');
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AIspresso/1.0.0',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username,
          password,
        }),
      });

      console.log(`🔴 Reddit API Token Response: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      console.log('🔴 Reddit API Token Response data:', data);
      
      if (data.access_token) {
        console.log('🔴 Reddit API: Access token received successfully');
        return data.access_token;
      } else {
        console.log('🔴 Reddit API: No access token in response');
        return null;
      }
    } catch (error) {
      console.error('🔴 Error getting Reddit access token:', error);
      return null;
    }
  }

  private async fetchHomeFeed(accessToken: string): Promise<RedditPost[]> {
    try {
      const url = `${RedditFetcher.BASE_URL}/.json?limit=50`;
      console.log(`🔴 Reddit API: Fetching home feed from ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'AIspresso/1.0.0',
        },
      });

      console.log(`🔴 Reddit API Home Feed Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🔴 Reddit API home feed error: ${response.status} ${response.statusText}`);
        console.error(`🔴 Reddit API error details:`, errorText);
        return [];
      }
      
      const data: RedditResponse = await response.json();
      console.log('🔴 Reddit API Home Feed data:', data);
      
      const posts = data.data.children.map(child => child.data);
      console.log(`🔴 Reddit API: Successfully fetched ${posts.length} posts from home feed`);
      return posts;
    } catch (error) {
      console.error('🔴 Error fetching Reddit home feed:', error);
      return [];
    }
  }

  private static convertToPost(post: RedditPost): Post {
    const embedData = {
      type: 'reddit' as const,
      postId: post.id,
      subreddit: post.subreddit,
    };

    return {
      id: `reddit-${post.id}`,
      source: 'reddit',
      title: post.title,
      url: post.is_self ? undefined : post.url,
      content: post.is_self ? post.selftext : undefined,
      author: post.author,
      timestamp: post.created_utc * 1000,
      score: post.score,
      commentsCount: post.num_comments,
      commentsUrl: `${RedditFetcher.BASE_URL}${post.permalink}`,
      thumbnail: post.thumbnail && !['self', 'default', 'nsfw'].includes(post.thumbnail) 
        ? post.thumbnail 
        : undefined,
      embedData,
    };
  }
}