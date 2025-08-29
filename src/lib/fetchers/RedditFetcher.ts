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
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.error('Unable to get Reddit access token');
        return [];
      }

      const posts = await this.fetchHomeFeed(accessToken);
      return posts.map(RedditFetcher.convertToPost);
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      return [];
    }
  }

  private async getAccessToken(): Promise<string | null> {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const username = process.env.REDDIT_USERNAME;
    const password = process.env.REDDIT_PASSWORD;

    if (!clientId || !clientSecret || !username || !password) {
      console.error('Missing Reddit API credentials');
      return null;
    }

    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AIspresso/1.0.0',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username,
          password,
        }),
      });

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      console.error('Error getting Reddit access token:', error);
      return null;
    }
  }

  private async fetchHomeFeed(accessToken: string): Promise<RedditPost[]> {
    try {
      const response = await fetch(`${RedditFetcher.BASE_URL}/.json?limit=50`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'AIspresso/1.0.0',
        },
      });

      const data: RedditResponse = await response.json();
      return data.data.children.map(child => child.data);
    } catch (error) {
      console.error('Error fetching Reddit home feed:', error);
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