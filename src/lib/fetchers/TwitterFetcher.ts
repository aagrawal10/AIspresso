import { Post, FeedConfig, FeedFetcherInterface } from '@/types';

interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
  attachments?: {
    media_keys?: string[];
  };
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TwitterResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
    media?: any[];
  };
}

export class TwitterFetcher implements FeedFetcherInterface {
  private static readonly BASE_URL = 'https://api.twitter.com/2';

  getSourceName() {
    return 'twitter' as const;
  }

  async fetchPosts(config: FeedConfig): Promise<Post[]> {
    try {
      console.log('🐦 TwitterFetcher: Making request to /api/feeds/twitter');
      const response = await fetch('/api/feeds/twitter?t=' + Date.now());
      
      if (!response.ok) {
        console.error('🐦 TwitterFetcher: API route error:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('🐦 TwitterFetcher: Received response:', data);
      
      if (data.error) {
        console.error('🐦 TwitterFetcher: API error:', data.error);
        return [];
      }
      
      console.log(`🐦 TwitterFetcher: Successfully fetched ${data.posts?.length || 0} posts`);
      return data.posts || [];
    } catch (error) {
      console.error('🐦 TwitterFetcher: Error calling API route:', error);
      return [];
    }
  }

  private async fetchListTweets(listId: string, bearerToken: string): Promise<Post[]> {
    try {
      const url = `${TwitterFetcher.BASE_URL}/lists/${listId}/tweets`;
      const params = new URLSearchParams({
        'tweet.fields': 'created_at,author_id,public_metrics,attachments',
        'expansions': 'author_id',
        'user.fields': 'username,name',
        'max_results': '25',
      });

      console.log(`🐦 Twitter API: Fetching from list ${listId}`);
      console.log(`🐦 Twitter API URL: ${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'User-Agent': 'AIspresso/1.0.0',
        },
      });

      console.log(`🐦 Twitter API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🐦 Twitter API error: ${response.status} ${response.statusText}`);
        console.error(`🐦 Twitter API error details:`, errorText);
        return [];
      }

      const data: TwitterResponse = await response.json();
      console.log(`🐦 Twitter API Response data:`, data);
      
      if (!data.data) {
        console.log(`🐦 Twitter API: No data.data field in response`);
        return [];
      }

      const users = new Map(
        (data.includes?.users || []).map(user => [user.id, user])
      );

      const posts = data.data.map(tweet => TwitterFetcher.convertToPost(tweet, users));
      console.log(`🐦 Twitter API: Successfully converted ${posts.length} tweets from list ${listId}`);
      return posts;
    } catch (error) {
      console.error(`🐦 Error fetching tweets from list ${listId}:`, error);
      return [];
    }
  }

  private static convertToPost(tweet: TwitterTweet, users: Map<string, TwitterUser>): Post {
    const author = users.get(tweet.author_id);
    const embedData = {
      type: 'twitter' as const,
      tweetId: tweet.id,
    };

    return {
      id: `twitter-${tweet.id}`,
      source: 'twitter',
      title: tweet.text.length > 100 
        ? `${tweet.text.substring(0, 97)}...` 
        : tweet.text,
      content: tweet.text,
      author: author ? `@${author.username}` : tweet.author_id,
      timestamp: new Date(tweet.created_at).getTime(),
      score: tweet.public_metrics?.like_count,
      commentsCount: tweet.public_metrics?.reply_count,
      commentsUrl: `https://twitter.com/i/status/${tweet.id}`,
      embedData,
    };
  }
}